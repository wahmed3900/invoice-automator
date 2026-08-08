const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const HF_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3';
const MAX_HISTORY = 10; // messages to keep per session

// Builds a real-time context block from the user's live invoice data
async function buildContext(userId) {
  const [clients, invoices, stats] = await Promise.all([
    prisma.client.findMany({ where: { userId }, select: { name: true, email: true } }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { client: { select: { name: true } } },
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  const overdue = invoices.filter(
    (i) => i.status === 'PENDING' && new Date(i.dueDate) < new Date()
  );

  const statLines = stats.map(
    (s) => `  ${s.status}: ${s._count} invoices, total $${(s._sum.totalAmount || 0).toFixed(2)}`
  );

  return [
    `Current date: ${new Date().toDateString()}`,
    `Clients (${clients.length}): ${clients.map((c) => c.name).join(', ') || 'none'}`,
    `Invoice summary:\n${statLines.join('\n') || '  No invoices yet'}`,
    `Overdue invoices (${overdue.length}): ${overdue.map((i) => `${i.invoiceNumber} – ${i.client?.name} – $${i.totalAmount}`).join('; ') || 'none'}`,
  ].join('\n');
}

function buildPrompt(context, history, userMessage) {
  const systemPrompt = `You are an intelligent invoice assistant built into an Invoice Reminder Automator app.
You help the user understand their invoices, clients, payments, and business health.
You can answer questions, give advice on chasing late payments, and summarise data.
Be concise, friendly, and practical. Never make up invoice data — use only what is provided in the context.

Live data for this user:
${context}`;

  // Format for Mistral Instruct
  let prompt = `<s>[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n`;

  for (let i = 0; i < history.length; i++) {
    const msg = history[i];
    if (msg.role === 'user') {
      prompt += i === 0 ? `${msg.content} [/INST] ` : `[INST] ${msg.content} [/INST] `;
    } else {
      prompt += `${msg.content} </s><s>`;
    }
  }

  prompt += `[INST] ${userMessage} [/INST]`;
  return prompt;
}

async function chat(userId, sessionId, userMessage) {
  // Load or create session
  let session = sessionId
    ? await prisma.chatSession.findFirst({ where: { id: sessionId, userId }, include: { messages: { orderBy: { createdAt: 'asc' } } } })
    : null;

  if (!session) {
    session = await prisma.chatSession.create({
      data: { userId },
      include: { messages: true },
    });
  }

  // Save user message
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'user', content: userMessage },
  });

  const recentHistory = session.messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const context = await buildContext(userId);
  const prompt = buildPrompt(context, recentHistory, userMessage);

  // Call Hugging Face Inference API
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Hugging Face API error: ${err}`);
  }

  const data = await response.json();
  const assistantReply = (data[0]?.generated_text || '').trim();

  // Save assistant reply
  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: 'assistant', content: assistantReply },
  });

  return { sessionId: session.id, reply: assistantReply };
}

async function getHistory(userId, sessionId) {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  return session?.messages ?? [];
}

async function getSessions(userId) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
  });
}

module.exports = { chat, getHistory, getSessions };
