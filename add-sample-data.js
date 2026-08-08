const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSampleData() {
  try {
    console.log('Starting to add sample data...');
    
    // Check if user exists
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { 
          email: 'wahmed07860786@gmail.com', 
          name: 'Waqas Ahmed' 
        }
      });
      console.log('User created');
    } else {
      console.log('User already exists');
    }

    // Check if client exists
    let client = await prisma.client.findFirst();
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: 'Acme Corporation',
          email: 'contact@acme.com',
          company: 'Acme Corp',
          address: '123 Business St, New York, NY 10001',
          userId: user.id
        }
      });
      console.log('Client created');
    } else {
      console.log('Client already exists');
    }

    // Check if invoice exists
    let invoice = await prisma.invoice.findFirst();
    if (!invoice) {
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-2026-001',
          clientId: client.id,
          userId: user.id,
          subtotal: 1000.00,
          taxRate: 10.00,
          taxAmount: 100.00,
          totalAmount: 1100.00,
          currency: 'USD',
          description: 'Consulting services',
          status: 'PENDING',
          issueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('Overdue invoice created');
    } else {
      console.log('Invoice already exists');
    }

    console.log('Sample data check complete!');
    
    // Show stats
    const stats = await prisma.invoice.aggregate({
      _count: true,
      _sum: { totalAmount: true }
    });
    console.log('Total invoices: ' + stats._count);
    console.log('Total amount: $' + (stats._sum.totalAmount || 0));

  } catch (e) {
    console.error('Error:', e.message);
    console.error('Full error:', e);
  } finally {
    // Make sure we disconnect
    await prisma.$disconnect();
  }
}

// Run the function
addSampleData();