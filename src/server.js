import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Invoice API is working!' });
});

// ==================== USERS ====================
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLIENTS ====================
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { invoices: true }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = await prisma.client.create({
      data: req.body
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVOICES ====================
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        user: true
      }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/overdue', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: new Date()
        }
      },
      include: {
        client: true,
        user: true
      }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/status/:status', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: req.params.status
      },
      include: {
        client: true,
        user: true
      }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = await prisma.invoice.create({
      data: req.body
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status,
        paidDate: status === 'PAID' ? new Date() : null
      }
    });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REMINDERS ====================
app.get('/api/reminders', async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      include: { invoice: true }
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTICS ====================
app.get('/api/stats', async (req, res) => {
  try {
    const totalInvoices = await prisma.invoice.count();
    const pendingInvoices = await prisma.invoice.count({
      where: { status: 'PENDING' }
    });
    const overdueInvoices = await prisma.invoice.count({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() }
      }
    });
    const paidInvoices = await prisma.invoice.count({
      where: { status: 'PAID' }
    });

    const totalRevenue = await prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true }
    });

    res.json({
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
  console.log('Test: http://localhost:' + PORT);
});
