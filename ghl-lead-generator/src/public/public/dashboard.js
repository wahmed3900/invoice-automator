// ============================================================
// CONFIG
// ============================================================
const API_BASE = ''; // Empty = use same domain (your Vercel app)
let statusChart = null; // For chart instance

// ============================================================
// DOM REFS
// ============================================================
const $ = (id) => document.getElementById(id);
const totalInvoices = $('totalInvoices');
const pendingInvoices = $('pendingInvoices');
const overdueInvoices = $('overdueInvoices');
const totalRevenue = $('totalRevenue');
const invoiceBody = $('invoiceBody');
const invoiceCount = $('invoiceCount');
const statusDot = $('statusDot');
const statusText = $('statusText');

// ============================================================
// HELPERS
// ============================================================
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStatusBadge(status) {
  const map = {
    PENDING: 'pending',
    PAID: 'paid',
    OVERDUE: 'overdue',
    DRAFT: 'draft',
  };
  const cls = map[status?.toUpperCase()] || 'draft';
  return `<span class="status-badge ${cls}">${status || 'DRAFT'}</span>`;
}

// ============================================================
// API FETCH
// ============================================================
async function fetchAPI(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`❌ Error fetching ${endpoint}:`, err.message);
    return null;
  }
}

// ============================================================
// RENDER CHART
// ============================================================
function renderChart(stats) {
  const ctx = document.getElementById('statusChart')?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart if it exists
  if (statusChart) {
    statusChart.destroy();
  }

  const data = {
    labels: ['Pending', 'Paid', 'Overdue'],
    datasets: [{
      data: [
        stats?.pendingInvoices || 0,
        stats?.paidInvoices || 0,
        stats?.overdueInvoices || 0
      ],
      backgroundColor: ['#f59e0b', '#22c55e', '#ef4444'],
      borderWidth: 0,
    }]
  };

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 12 }
          }
        }
      },
      cutout: '65%',
    }
  });
}

// ============================================================
// UPDATE UI
// ============================================================
function updateStatus(online) {
  statusDot.className = `status-dot ${online ? 'online' : 'offline'}`;
  statusText.textContent = online ? 'API Online' : 'API Offline';
}

async function loadDashboard() {
  // --- 1. API health check ---
  const health = await fetchAPI('/');
  updateStatus(!!health);
  if (!health) {
    invoiceBody.innerHTML = `<tr><td colspan="5" class="loading-text">⚠️ Could not connect to API</td></tr>`;
    return;
  }

  // --- 2. Stats ---
  const stats = await fetchAPI('/api/stats');
  if (stats) {
    totalInvoices.textContent = stats.totalInvoices ?? 0;
    pendingInvoices.textContent = stats.pendingInvoices ?? 0;
    overdueInvoices.textContent = stats.overdueInvoices ?? 0;
    totalRevenue.textContent = formatCurrency(stats.totalRevenue);
    
    // Render chart with stats
    renderChart(stats);
  }

  // --- 3. Invoices ---
  const invoices = await fetchAPI('/api/invoices');
  if (!invoices || invoices.length === 0) {
    invoiceBody.innerHTML = `<tr><td colspan="5" class="loading-text">📭 No invoices found</td></tr>`;
    invoiceCount.textContent = '0';
    return;
  }

  invoiceCount.textContent = invoices.length;

  // Show latest 10 invoices
  const latest = invoices.slice(-10).reverse();
  invoiceBody.innerHTML = latest.map((inv) => `
    <tr>
      <td><strong>${inv.invoiceNumber || 'N/A'}</strong></td>
      <td>${inv.client?.name || 'Unknown'}</td>
      <td>${formatCurrency(inv.totalAmount)}</td>
      <td>${getStatusBadge(inv.status)}</td>
      <td>${formatDate(inv.dueDate)}</td>
    </tr>
  `).join('');
}

// ============================================================
// GO!
// ============================================================
document.addEventListener('DOMContentLoaded', loadDashboard);

// Auto-refresh every 60 seconds (optional)
// setInterval(loadDashboard, 60000);