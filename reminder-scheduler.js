const { PrismaClient } = require('@prisma/client');
const { sendReminderEmail } = require('./email.service');
const { sendWhatsAppReminder } = require('./src/services/whatsapp.service');

const prisma = new PrismaClient();

// Days relative to dueDate that trigger each stage (negative = before due)
const STAGES = [
  { stage: 1, label: 'upcoming-7d',  daysFromDue: -7  },
  { stage: 2, label: 'due-tomorrow', daysFromDue: -1  },
  { stage: 3, label: 'overdue-3d',   daysFromDue:  3  },
  { stage: 4, label: 'overdue-7d',   daysFromDue:  7  },
  { stage: 5, label: 'final-14d',    daysFromDue:  14 },
];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function sendStageReminder(invoice, stage) {
  const emailResult = await sendReminderEmail(invoice, invoice.client, stage.stage);

  // Send WhatsApp too if client has a phone number (Pro users only)
  if (invoice.client.phone && invoice.user?.subscription === 'PRO') {
    await sendWhatsAppReminder(invoice, invoice.client, stage.stage);
  }

  await prisma.reminder.create({
    data: {
      invoiceId: invoice.id,
      type: stage.label,
      status: emailResult.success ? 'SENT' : 'FAILED',
      error: emailResult.success ? null : (emailResult.error || null),
    },
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      reminderSent: true,
      reminderCount: { increment: 1 },
      reminderStage: stage.stage,
    },
  });

  console.log(`[scheduler] stage ${stage.stage} (${stage.label}) — ${emailResult.success ? 'sent' : 'failed'} for ${invoice.invoiceNumber}`);
}

async function runReminderCycle() {
  console.log('[scheduler] running cycle', new Date().toISOString());

  const pending = await prisma.invoice.findMany({
    where: { status: 'PENDING' },
    include: { client: true, user: true },
  });

  const now = new Date();

  for (const invoice of pending) {
    const due = new Date(invoice.dueDate);
    const currentStage = invoice.reminderStage || 0;

    // Find the highest stage whose trigger date has passed but hasn't been sent yet
    for (let i = STAGES.length - 1; i >= 0; i--) {
      const s = STAGES[i];
      if (s.stage <= currentStage) break; // already sent this or later stage

      const triggerDate = addDays(due, s.daysFromDue);
      if (now >= triggerDate) {
        await sendStageReminder(invoice, s);
        break; // only advance one stage per cycle
      }
    }

    // Auto-mark as OVERDUE in DB once past due date
    if (now > due && invoice.status === 'PENDING') {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: 'OVERDUE' },
      });
    }
  }

  console.log(`[scheduler] cycle done — checked ${pending.length} pending invoice(s)`);
}

function startScheduler() {
  console.log('[scheduler] starting — checks every hour');
  runReminderCycle();
  setInterval(runReminderCycle, 60 * 60 * 1000);
}

async function runOnce() {
  await runReminderCycle();
  await prisma.$disconnect();
  process.exit(0);
}

if (process.argv.includes('--once')) runOnce();

module.exports = { startScheduler, runReminderCycle };

  checkUpcomingInvoices 
};
