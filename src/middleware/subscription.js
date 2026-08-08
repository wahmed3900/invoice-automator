const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PLANS = {
  FREE: { maxClients: 5, maxInvoices: 10, autoReminders: false },
  PRO:  { maxClients: Infinity, maxInvoices: Infinity, autoReminders: true },
};

// Returns the user's current plan limits
function getLimits(subscription) {
  return PLANS[subscription] ?? PLANS.FREE;
}

// Blocks invoice creation when the user has hit their plan limit
async function checkInvoiceLimit(req, res, next) {
  try {
    const limits = getLimits(req.user.subscription);
    if (limits.maxInvoices === Infinity) return next();

    const count = await prisma.invoice.count({ where: { userId: req.user.userId } });
    if (count >= limits.maxInvoices) {
      return res.status(403).json({
        error: `Free plan is limited to ${limits.maxInvoices} invoices. Upgrade to Pro for unlimited.`,
        upgradeRequired: true,
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Blocks client creation when the user has hit their plan limit
async function checkClientLimit(req, res, next) {
  try {
    const limits = getLimits(req.user.subscription);
    if (limits.maxClients === Infinity) return next();

    const count = await prisma.client.count({ where: { userId: req.user.userId } });
    if (count >= limits.maxClients) {
      return res.status(403).json({
        error: `Free plan is limited to ${limits.maxClients} clients. Upgrade to Pro for unlimited.`,
        upgradeRequired: true,
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Blocks access to Pro-only features
function requirePro(req, res, next) {
  if (req.user.subscription !== 'PRO') {
    return res.status(403).json({
      error: 'This feature requires a Pro subscription.',
      upgradeRequired: true,
    });
  }
  next();
}

module.exports = { getLimits, checkInvoiceLimit, checkClientLimit, requirePro, PLANS };
