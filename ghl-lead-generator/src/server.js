const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// ==========================
// Middleware
// ==========================
app.use(cors());
app.use(express.json());

// ==========================
// Root Route – API Info with DB check
// ==========================
app.get('/', async (req, res) => {
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  res.json({
    status: 'ok',
    service: 'Invoice Reminder Automator API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: dbConnected,
      provider: 'postgresql'
    },
    endpoints: [
      { method: 'GET', path: '/', description: 'API information' },
      { method: 'GET', path: '/api/users', description: 'Get all users' },
      { method: 'GET', path: '/api/clients', description: 'Get all clients with invoices' },
      { method: 'POST', path: '/api/clients', description: 'Create a new client' },
      { method: 'GET', path: '/api/invoices', description: 'Get all invoices with client & user' },
      { method: 'GET', path: '/api/invoices/overdue', description: 'Get overdue invoices' },
      { method: 'GET', path: '/api/invoices/status/:status', description: 'Get invoices by status' },
      { method: 'POST', path: '/api/invoices', description: 'Create a new invoice' },
      { method: 'PATCH', path: '/api/invoices/:id/status', description: 'Update invoice status' },
      { method: 'GET', path: '/api/reminders', description: 'Get all reminders' },
      { method: 'GET', path: '/api/stats', description: 'Get dashboard statistics' },
    ]
  });
});

// ==========================
// USERS
// ==========================
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('GET /api/users error:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// ==========================
// CLIENTS
// ==========================
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { invoices: true }
    });
    res.json(clients);
  } catch (error) {
    console.error('GET /api/clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { name, email, phone, company, address, taxId, userId } = req.body;
    
    if (!name || !email || !userId) {
      return res.status(400).json({ error: 'name, email, and userId are required' });
    }

    const client = await prisma.client.create({
      data: { name, email, phone, company, address, taxId, userId }
    });
    res.status(201).json(client);
  } catch (error) {
    console.error('POST /api/clients error:', error);
    res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
});

// ==========================
// INVOICES
// ==========================
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
    console.error('GET /api/invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices', details: error.message });
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
    console.error('GET /api/invoices/overdue error:', error);
    res.status(500).json({ error: 'Failed to fetch overdue invoices', details: error.message });
  }
});

app.get('/api/invoices/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const invoices = await prisma.invoice.findMany({
      where: { status },
      include: {
        client: true,
        user: true
      }
    });
    res.json(invoices);
  } catch (error) {
    console.error('GET /api/invoices/status/:status error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices by status', details: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { 
      invoiceNumber, clientId, userId, subtotal, taxRate, taxAmount, 
      discount = 0, totalAmount, currency = 'USD', description, 
      issueDate, dueDate, status = 'PENDING' 
    } = req.body;

    if (!invoiceNumber || !clientId || !userId || !subtotal || !totalAmount || !issueDate || !dueDate) {
      return res.status(400).json({ error: 'Missing required invoice fields' });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        userId,
        subtotal,
        taxRate,
        taxAmount,
        discount,
        totalAmount,
        currency,
        description,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status
      }
    });
    res.status(201).json(invoice);
  } catch (error) {
    console.error('POST /api/invoices error:', error);
    res.status(500).json({ error: 'Failed to create invoice', details: error.message });
  }
});

app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { 
        status,
        paidDate: status === 'PAID' ? new Date() : null
      }
    });
    res.json(invoice);
  } catch (error) {
    console.error('PATCH /api/invoices/:id/status error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(500).json({ error: 'Failed to update invoice status', details: error.message });
  }
});

// ==========================
// REMINDERS
// ==========================
app.get('/api/reminders', async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      include: { invoice: true }
    });
    res.json(reminders);
  } catch (error) {
    console.error('GET /api/reminders error:', error);
    res.status(500).json({ error: 'Failed to fetch reminders', details: error.message });
  }
});

// ==========================
// STATISTICS
// ==========================
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    const [totalInvoices, pendingInvoices, overdueInvoices, paidInvoices, revenueResult] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PENDING' } }),
      prisma.invoice.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: now }
        }
      }),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      totalRevenue: revenueResult._sum.totalAmount || 0
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
  }
});

// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    path: req.originalUrl,
    message: 'The requested API endpoint does not exist. Check the root endpoint (/) for available routes.'
  });
});

// ✅ FOR VERCEL – Export the app as a serverless function
module.exports = app;

// ✅ FOR LOCAL DEVELOPMENT – Run the server normally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Invoice Reminder Automator API running on port ${PORT}`);
  });
}

// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Invoice Reminder Automator API running on port ${PORT}`);
  console.log(`📡 API base URL: http://localhost:${PORT}`);
  console.log(`🔗 Available endpoints: GET /, /api/users, /api/clients, /api/invoices, /api/stats, /api/reminders`);
});