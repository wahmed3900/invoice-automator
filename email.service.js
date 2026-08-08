const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
}

// Returns subject + HTML body tailored to each escalation stage
function buildEmail(stage, invoice, client, appUrl) {
  const payLink = `${appUrl}/pay/${invoice.id}`;
  const amount = `$${Number(invoice.totalAmount).toFixed(2)}`;
  const due = new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const num = invoice.invoiceNumber;
  const name = client.name || 'there';

  const wrap = (accentColor, badge, heading, body) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <tr><td style="background:${accentColor};padding:24px 32px">
        <p style="margin:0;color:#fff;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">${badge}</p>
        <h1 style="margin:8px 0 0;color:#fff;font-size:22px">${heading}</h1>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;color:#374151;font-size:15px">Hi ${name},</p>
        ${body}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb">
          <tr><td style="padding:16px 20px">
            <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px">Invoice Details</p>
            <p style="margin:0;color:#111827;font-size:15px"><strong>Invoice:</strong> ${num}</p>
            <p style="margin:4px 0 0;color:#111827;font-size:15px"><strong>Amount:</strong> ${amount}</p>
            <p style="margin:4px 0 0;color:#111827;font-size:15px"><strong>Due:</strong> ${due}</p>
          </td></tr>
        </table>
        <a href="${payLink}" style="display:inline-block;padding:12px 28px;background:${accentColor};color:#fff;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px">Pay Now →</a>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:12px">Questions? Reply to this email or contact us at ${process.env.EMAIL_USER}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  const stages = {
    1: { // 7 days before due
      subject: `Friendly reminder: Invoice ${num} due ${due}`,
      html: wrap('#3b82f6', 'Payment Reminder', `Invoice ${num} due in 7 days`,
        `<p style="margin:0 0 16px;color:#374151;font-size:15px">Just a friendly heads-up that the above invoice is due in <strong>7 days</strong>. No action needed if you've already arranged payment — otherwise the button below makes it quick and easy.</p>`),
    },
    2: { // due tomorrow
      subject: `Due tomorrow: Invoice ${num} — ${amount}`,
      html: wrap('#f59e0b', 'Due Tomorrow', `Invoice ${num} is due tomorrow`,
        `<p style="margin:0 0 16px;color:#374151;font-size:15px">This is a reminder that invoice <strong>${num}</strong> for <strong>${amount}</strong> is due <strong>tomorrow</strong>. Please arrange payment today to avoid any late fees.</p>`),
    },
    3: { // 3 days overdue
      subject: `Overdue: Invoice ${num} — action required`,
      html: wrap('#ef4444', 'Overdue Notice', `Invoice ${num} is now overdue`,
        `<p style="margin:0 0 16px;color:#374151;font-size:15px">Invoice <strong>${num}</strong> for <strong>${amount}</strong> was due on <strong>${due}</strong> and remains unpaid. Please settle this at your earliest convenience.</p><p style="margin:0 0 16px;color:#374151;font-size:15px">If you've already sent payment, please disregard this notice.</p>`),
    },
    4: { // 7 days overdue
      subject: `2nd notice — Invoice ${num} still unpaid`,
      html: wrap('#dc2626', 'Second Notice', `Invoice ${num} — 7 days overdue`,
        `<p style="margin:0 0 16px;color:#374151;font-size:15px">We have not yet received payment for invoice <strong>${num}</strong> (${amount}), which was due on ${due}. This is our second notice.</p><p style="margin:0 0 16px;color:#374151;font-size:15px">Please make payment immediately or contact us to discuss payment arrangements.</p>`),
    },
    5: { // 14+ days overdue — final notice
      subject: `FINAL NOTICE — Invoice ${num} — ${amount} overdue`,
      html: wrap('#7f1d1d', 'Final Notice', `Final notice: Invoice ${num}`,
        `<p style="margin:0 0 16px;color:#374151;font-size:15px">Despite previous reminders, invoice <strong>${num}</strong> for <strong>${amount}</strong> (due ${due}) remains unpaid.</p><p style="margin:0 0 16px;color:#374151;font-size:15px"><strong>This is our final notice.</strong> If payment is not received within 48 hours, we may need to escalate this matter further.</p>`),
    },
  };

  return stages[stage] || stages[3];
}

async function sendReminderEmail(invoice, client, stage = 3) {
  try {
    const appUrl = process.env.APP_URL || 'http://localhost:5000';

    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
      console.log(`[email] preview — stage ${stage} to ${client.email} for ${invoice.invoiceNumber}`);
      return { success: true, preview: true };
    }

    const { subject, html } = buildEmail(stage, invoice, client, appUrl);
    const info = await getTransporter().sendMail({
      from: `"Invoice Automator" <${process.env.EMAIL_USER}>`,
      to: client.email,
      subject,
      html,
    });

    console.log(`[email] stage ${stage} sent to ${client.email} — ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[email] error:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendReminderEmail };

