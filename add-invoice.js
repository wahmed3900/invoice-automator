const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addInvoice() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'wahmed07860786@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    // Find the client
    const client = await prisma.client.findFirst({
      where: { 
        email: 'contact@acme.com',
        userId: user.id 
      }
    });

    if (!client) {
      console.log('❌ Client not found! Please create a client first.');
      return;
    }

    console.log('✅ Found user:', user.email);
    console.log('✅ Found client:', client.name);

    // Create Invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-001',
        clientId: client.id,
        userId: user.id,
        subtotal: 1000.00,
        taxRate: 10.00,
        taxAmount: 100.00,
        discount: 0,
        totalAmount: 1100.00,
        currency: 'USD',
        description: 'Consulting services for Q3 2026',
        status: 'PENDING',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        reminderSent: false,
        reminderCount: 0
      }
    });
    console.log('✅ Invoice created:', invoice.invoiceNumber);
    console.log('💰 Total amount: $' + invoice.totalAmount);
    console.log('📅 Due date:', invoice.dueDate);

  } catch (e) {
    if (e.code === 'P2002') {
      console.log('⚠️  Invoice already exists!');
    } else {
      console.error('❌ Error:', e.message);
    }
  } finally {
    await prisma.();
  }
}

addInvoice();
