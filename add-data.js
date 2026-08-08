const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addData() {
  try {
    // Find existing user
    const user = await prisma.user.findUnique({
      where: { email: 'wahmed07860786@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found! Please create a user first.');
      return;
    }

    console.log('✅ Found user:', user.email);

    // Create Client
    const client = await prisma.client.create({
      data: {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        address: '123 Business St, New York, NY 10001',
        taxId: '12-3456789',
        userId: user.id
      }
    });
    console.log('✅ Client created:', client.name);

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

    console.log('\n✅ All data added successfully!');
    console.log('📊 Check Prisma Studio to see your data.');

  } catch (e) {
    if (e.code === 'P2002') {
      console.log('⚠️  Data already exists! Check Prisma Studio.');
    } else {
      console.error('❌ Error:', e.message);
    }
  } finally {
    await prisma.();
  }
}

addData();
