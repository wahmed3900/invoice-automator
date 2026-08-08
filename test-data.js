const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // Check if user exists
    let user = await prisma.user.findFirst();
    
    if (!user) {
      // Create a user if none exists
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashed_password_here',
          name: 'Test User'
        }
      });
      console.log('✅ User created:', user.email);
    } else {
      console.log('✅ Found existing user:', user.email);
    }

    // Create a client
    const client = await prisma.client.create({
      data: {
        name: 'Acme Corp',
        email: 'contact@acme.com',
        phone: '+1234567890',
        company: 'Acme Corporation',
        userId: user.id
      }
    });
    console.log('✅ Client created:', client.name);

    // Create an invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-001',
        clientId: client.id,
        userId: user.id,
        subtotal: 1000.00,
        taxRate: 10.00,
        taxAmount: 100.00,
        totalAmount: 1100.00,
        currency: 'USD',
        description: 'Consulting services',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'PENDING'
      }
    });
    console.log('✅ Invoice created:', invoice.invoiceNumber);
    console.log('💰 Amount:', invoice.totalAmount);

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.();
  }
}

test();
