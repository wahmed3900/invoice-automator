// Receives Stripe payment events and auto-marks invoices as PAID
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Verifies the Stripe-Signature header to ensure the request is genuine
function verifyStripeSignature(rawBody, signature, secret) {
  const [timestampPart, sigPart] = signature.split(',').reduce(
    (acc, part) => {
      if (part.startsWith('t=')) acc[0] = part.slice(2);
      if (part.startsWith('v1=')) acc[1] = part.slice(3);
      return acc;
    },
    ['', '']
  );

  const signed = `${timestampPart}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigPart));
}

async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });

  let rawBody;
  try {
    rawBody = JSON.stringify(req.body);
    if (!verifyStripeSignature(rawBody, sig, secret)) {
      return res.status(400).json({ error: 'Invalid Stripe signature' });
    }
  } catch {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  const event = req.body;

  if (event.type === 'payment_intent.succeeded') {
    const invoiceId = event.data.object.metadata?.invoiceId;
    if (invoiceId) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidDate: new Date() },
      });
      console.log(`[stripe] auto-marked invoice ${invoiceId} as PAID`);
    }
  }

  if (event.type === 'checkout.session.completed') {
    const invoiceId = event.data.object.metadata?.invoiceId;
    if (invoiceId) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidDate: new Date() },
      });
      console.log(`[stripe] checkout complete — invoice ${invoiceId} marked PAID`);
    }
  }

  res.json({ received: true });
}

module.exports = { handleStripeWebhook };
