const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
}

async function sendReminderEmail(invoice, client) {
  try {
    const transporter = getTransporter();
    
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
      console.log('Email not configured. Would send reminder to:', client.email);
      console.log('Subject: Invoice ' + invoice.invoiceNumber + ' is Overdue');
      console.log('Amount: $' + invoice.totalAmount);
      return { success: true, preview: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: client.email,
      subject: 'Invoice ' + invoice.invoiceNumber + ' - Payment Reminder',
      html: '<h2>Invoice Reminder</h2><p>Dear ' + (client.name || 'Customer') + ',</p><p>This is a reminder that invoice <strong>' + invoice.invoiceNumber + '</strong> is due.</p><p><strong>Amount Due:</strong> $' + invoice.totalAmount.toFixed(2) + '</p><p><strong>Due Date:</strong> ' + new Date(invoice.dueDate).toLocaleDateString() + '</p><p><a href="' + (process.env.APP_URL || 'http://localhost:5000') + '/pay/' + invoice.id + '">Pay Invoice Now</a></p>'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent to:', client.email);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendReminderEmail };
