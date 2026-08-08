require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { passport, issueToken, requireAuth } = require('./src/middleware/auth');
const { checkInvoiceLimit, checkClientLimit, requirePro, getLimits, PLANS } = require('./src/middleware/subscription');
const { startScheduler } = require('./reminder-scheduler');
const aiChat = require('./src/services/ai-chat.service');
const { startKeepAlive } = require('./src/services/keep-alive');
const { handleStripeWebhook } = require('./src/services/stripe-webhook');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.get('/', (_req, res) => res.json({ message: 'Invoice API is working!' }));

// Render uses this path for health checks and the keep-alive pinger
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Stripe must receive the raw body — mount before express.json() parses it
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// ==================== GOOGLE AUTH ====================
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failed' }),
  (req, res) => {
    const token = issueToken(req.user);
    const redirect = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${redirect}/auth/callback?token=${token}`);
  }
);

app.get('/auth/failed', (_req, res) => res.status(401).json({ error: 'Google authentication failed' }));

// Returns the authenticated user's profile + plan limits
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user, limits: getLimits(user.subscription) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SUBSCRIPTION ====================
app.get('/api/plans', (_req, res) => res.json(PLANS));

app.post('/api/subscription/upgrade', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { subscription: 'PRO', proExpiresAt: null },
    });
    res.json({ subscription: user.subscription, message: 'Upgraded to Pro!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/subscription/downgrade', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { subscription: 'FREE', proExpiresAt: null },
    });
    res.json({ subscription: user.subscription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USERS ====================
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CLIENTS ====================
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user.userId },
      include: { invoices: true },
    });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', requireAuth, checkClientLimit, async (req, res) => {
  try {
    const client = await prisma.client.create({
      data: { ...req.body, userId: req.user.userId },
    });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    const client = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', requireAuth, async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== INVOICES ====================
app.get('/api/invoices', requireAuth, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.userId },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/overdue', requireAuth, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.userId, status: 'PENDING', dueDate: { lt: new Date() } },
      include: { client: true },
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/status/:status', requireAuth, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.userId, status: req.params.status },
      include: { client: true },
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id', requireAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { client: true, reminders: true },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', requireAuth, checkInvoiceLimit, async (req, res) => {
  try {
    const invoice = await prisma.invoice.create({
      data: { ...req.body, userId: req.user.userId },
    });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/invoices/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status, paidDate: status === 'PAID' ? new Date() : null },
    });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', requireAuth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: req.body });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', requireAuth, async (req, res) => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== REMINDERS ====================
app.get('/api/reminders', requireAuth, async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { invoice: { userId: req.user.userId } },
      include: { invoice: true },
    });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pro only — manually trigger reminder scan
app.post('/api/reminders/run', requireAuth, requirePro, async (req, res) => {
  try {
    const { checkOverdueInvoices, checkUpcomingInvoices } = require('./reminder-scheduler');
    await checkOverdueInvoices();
    await checkUpcomingInvoices();
    res.json({ success: true, message: 'Reminder check completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== STATISTICS ====================
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [totalInvoices, pendingInvoices, overdueInvoices, paidInvoices, totalRevenue] =
      await Promise.all([
        prisma.invoice.count({ where: { userId } }),
        prisma.invoice.count({ where: { userId, status: 'PENDING' } }),
        prisma.invoice.count({ where: { userId, status: 'PENDING', dueDate: { lt: new Date() } } }),
        prisma.invoice.count({ where: { userId, status: 'PAID' } }),
        prisma.invoice.aggregate({ where: { userId, status: 'PAID' }, _sum: { totalAmount: true } }),
      ]);
    res.json({
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== AI CHAT BOT ====================
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message is required' });
    const result = await aiChat.chat(req.user.userId, sessionId || null, message.trim());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chat/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await aiChat.getSessions(req.user.userId);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chat/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const messages = await aiChat.getHistory(req.user.userId, req.params.sessionId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Google OAuth → http://localhost:${PORT}/auth/google`);
  console.log(`AI Chat     → POST http://localhost:${PORT}/api/chat`);
  startScheduler();
  startKeepAlive();
});
