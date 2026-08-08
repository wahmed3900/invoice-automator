// Pro-only: sends WhatsApp reminders via Twilio WhatsApp API
// Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  // Lazy-require so the app boots fine if Twilio isn't installed
  try {
    return require('twilio')(sid, token);
  } catch {
    return null;
  }
}

async function sendWhatsAppReminder(invoice, client, stage) {
  const client_ = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM; // e.g. whatsapp:+14155238886
  const to = client.phone;

  if (!client_ || !from || !to) {
    console.log(`[whatsapp] not configured — skipping for ${invoice.invoiceNumber}`);
    return { success: false, reason: 'not_configured' };
  }

  const amount = `$${Number(invoice.totalAmount).toFixed(2)}`;
  const due = new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const appUrl = process.env.APP_URL || 'http://localhost:5000';

  const messages = {
    1: `Hi ${client.name}! 👋 Just a friendly reminder — invoice *${invoice.invoiceNumber}* for *${amount}* is due in 7 days (${due}). Pay here: ${appUrl}/pay/${invoice.id}`,
    2: `Hi ${client.name} — invoice *${invoice.invoiceNumber}* (${amount}) is due *tomorrow*. Please arrange payment: ${appUrl}/pay/${invoice.id}`,
    3: `Hi ${client.name}, invoice *${invoice.invoiceNumber}* for *${amount}* was due on ${due} and is now overdue. Please pay at your earliest convenience: ${appUrl}/pay/${invoice.id}`,
    4: `⚠️ ${client.name} — 2nd notice. Invoice *${invoice.invoiceNumber}* (${amount}) is 7 days overdue. Please settle immediately: ${appUrl}/pay/${invoice.id}`,
    5: `🚨 FINAL NOTICE — ${client.name}, invoice *${invoice.invoiceNumber}* (${amount}) is 14+ days overdue. Pay now to avoid escalation: ${appUrl}/pay/${invoice.id}`,
  };

  try {
    await client_.messages.create({
      from,
      to: `whatsapp:${to}`,
      body: messages[stage] || messages[3],
    });
    console.log(`[whatsapp] stage ${stage} sent to ${to}`);
    return { success: true };
  } catch (err) {
    console.error('[whatsapp] error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendWhatsAppReminder };
