const { PrismaClient } = require('@prisma/client');
const { sendReminderEmail } = require('./email.service');
const prisma = new PrismaClient();

async function checkOverdueInvoices() {
  console.log('Checking for overdue invoices...', new Date().toISOString());
  
  try {
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: new Date() },
        reminderSent: false
      },
      include: { client: true, user: true }
    });

    if (overdueInvoices.length === 0) {
      console.log('No overdue invoices found');
      return;
    }

    console.log('Found ' + overdueInvoices.length + ' overdue invoice(s)');

    for (const invoice of overdueInvoices) {
      console.log('Sending reminder for invoice:', invoice.invoiceNumber);
      const result = await sendReminderEmail(invoice, invoice.client);
      
      await prisma.reminder.create({
        data: {
          invoiceId: invoice.id,
          type: 'OVERDUE',
          status: result.success ? 'SENT' : 'FAILED',
          error: result.success ? null : result.error
        }
      });

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          reminderSent: true,
          reminderCount: { increment: 1 }
        }
      });

      console.log(result.success ? 'Reminder sent' : 'Reminder failed');
    }
  } catch (error) {
    console.error('Error checking overdue invoices:', error.message);
  }
}

async function checkUpcomingInvoices() {
  console.log('Checking for upcoming due dates...', new Date().toISOString());
  
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const upcomingInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: new Date(), lte: sevenDaysFromNow },
        reminderCount: 0
      },
      include: { client: true, user: true }
    });

    if (upcomingInvoices.length === 0) {
      console.log('No upcoming invoices found');
      return;
    }

    console.log('Found ' + upcomingInvoices.length + ' upcoming invoice(s)');

    for (const invoice of upcomingInvoices) {
      console.log('Sending upcoming reminder for:', invoice.invoiceNumber);
      const result = await sendReminderEmail(invoice, invoice.client);
      
      await prisma.reminder.create({
        data: {
          invoiceId: invoice.id,
          type: 'UPCOMING',
          status: result.success ? 'SENT' : 'FAILED',
          error: result.success ? null : result.error
        }
      });

      console.log(result.success ? 'Upcoming reminder sent' : 'Failed');
    }
  } catch (error) {
    console.error('Error checking upcoming invoices:', error.message);
  }
}

function startScheduler() {
  console.log('Starting reminder scheduler...');
  checkOverdueInvoices();
  checkUpcomingInvoices();
  setInterval(function() {
    checkOverdueInvoices();
    checkUpcomingInvoices();
  }, 60 * 60 * 1000);
  console.log('Scheduler running (checks every hour)');
}

async function runOnce() {
  console.log('Running reminder check once...');
  await checkOverdueInvoices();
  await checkUpcomingInvoices();
  process.exit(0);
}

if (process.argv.includes('--once')) {
  runOnce();
}

module.exports = { 
  startScheduler, 
  checkOverdueInvoices, 
  checkUpcomingInvoices 
};
