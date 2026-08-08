const { sendReminderEmail } = require('./src/services/email.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEmail() {
  console.log('Testing email...');
  const invoice = await prisma.invoice.findFirst({ include: { client: true } });
  if (!invoice) {
    console.log('No invoice found.');
    prisma.();
    return;
  }
  console.log('Invoice:', invoice.invoiceNumber);
  console.log('Client:', invoice.client.email);
  const result = await sendReminderEmail(invoice, invoice.client);
  if (result.success) {
    console.log('Email test successful!');
    if (result.preview) console.log('Preview mode - email not actually sent');
  } else {
    console.log('Email test failed:', result.error);
  }
  prisma.();
}

testEmail();
