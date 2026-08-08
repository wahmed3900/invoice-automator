const { PrismaClient } = require('@prisma/client');
const { sendReminderEmail } = require('./src/services/email.service');
const { checkOverdueInvoices, checkUpcomingInvoices } = require('./src/services/reminder-scheduler');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing Reminder System');
  const invoices = await prisma.invoice.findMany({ include: { client: true } });
  console.log('Found ' + invoices.length + ' invoices');
  if (invoices.length === 0) {
    console.log('No invoices found.');
    prisma.();
    return;
  }
  for (const inv of invoices) {
    console.log('  - ' + inv.invoiceNumber + ': $' + inv.totalAmount + ' (' + inv.status + ')');
  }
  console.log('Running reminder check...');
  await checkOverdueInvoices();
  await checkUpcomingInvoices();
  const reminders = await prisma.reminder.findMany({ include: { invoice: true } });
  console.log('Found ' + reminders.length + ' reminders');
  for (const r of reminders) {
    console.log('  - ' + r.type + ' reminder for ' + r.invoice.invoiceNumber + ' (' + r.status + ')');
  }
  console.log('Test complete!');
  prisma.();
}

test();
