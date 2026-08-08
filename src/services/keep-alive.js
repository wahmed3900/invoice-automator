// Render free tier sleeps after 15 min of inactivity — this pings itself every 14 min.
// Set RENDER_SELF_URL to your deployed URL (e.g. https://invoice-automator-api.onrender.com)
// For guaranteed uptime, also add it to https://uptimerobot.com (free, 5-min interval).

const PING_INTERVAL_MS = 14 * 60 * 1000;

function startKeepAlive() {
  const selfUrl = process.env.RENDER_SELF_URL;
  if (!selfUrl) return; // skip in local dev

  setInterval(async () => {
    try {
      const res = await fetch(`${selfUrl}/health`);
      console.log(`[keep-alive] ping ${res.status} at ${new Date().toISOString()}`);
    } catch (err) {
      console.warn('[keep-alive] ping failed:', err.message);
    }
  }, PING_INTERVAL_MS);

  console.log(`[keep-alive] pinging ${selfUrl}/health every 14 min`);
}

module.exports = { startKeepAlive };
