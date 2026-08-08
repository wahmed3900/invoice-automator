// server.js - MongoDB with Mongoose
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ==================== MONGODB CONNECTION ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/invoicereminder';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ==================== SCHEMAS ====================
// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: String,
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// Client Schema
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  company: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});
const Client = mongoose.model('Client', clientSchema);

// Invoice Schema
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalAmount: { type: Number, required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
    default: 'PENDING'
  },
  paidDate: Date,
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  createdAt: { type: Date, default: Date.now }
});
const Invoice = mongoose.model('Invoice', invoiceSchema);

// Reminder Schema
const reminderSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  reminderDate: { type: Date, default: Date.now },
  sentDate: Date,
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  message: String
});
const Reminder = mongoose.model('Reminder', reminderSchema);

// ==================== TEST ENDPOINT ====================
app.get('/', (req, res) => {
  res.json({ message: 'Invoice API with MongoDB is working!' });
});

// ==================== USERS ====================
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLIENTS ====================
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVOICES ====================
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('clientId')
      .populate('userId');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/overdue', async (req, res) => {
  try {
    const invoices = await Invoice.find({
      status: 'PENDING',
      dueDate: { $lt: new Date() }
    }).populate('clientId').populate('userId');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/status/:status', async (req, res) => {
  try {
    const invoices = await Invoice.find({
      status: req.params.status
    }).populate('clientId').populate('userId');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        paidDate: status === 'PAID' ? new Date() : null
      },
      { new: true }
    );
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== REMINDERS ====================
app.get('/api/reminders', async (req, res) => {
  try {
    const reminders = await Reminder.find().populate('invoiceId');
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTICS ====================
app.get('/api/stats', async (req, res) => {
  try {
    const totalInvoices = await Invoice.countDocuments();
    const pendingInvoices = await Invoice.countDocuments({ status: 'PENDING' });
    const overdueInvoices = await Invoice.countDocuments({
      status: 'PENDING',
      dueDate: { $lt: new Date() }
    });
    const paidInvoices = await Invoice.countDocuments({ status: 'PAID' });

    const totalRevenue = await Invoice.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}`);
  console.log(`📦 MongoDB: ${MONGODB_URI}`);
});
