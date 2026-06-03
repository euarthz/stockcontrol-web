/* ============================================================
   StockControl Web – Utilitários Compartilhados
   ============================================================ */

const API = 'http://localhost:3000/api';

/* ---- Formatação ---- */
const formatBRL = v =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const formatDate = d => {
  if (!d) return '–';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('pt-BR');
};

const formatDateTime = d => {
  if (!d) return '–';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
};

/* ---- Requisições à API ---- */
async function apiRequest(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res  = await fetch(API + url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  } catch (e) {
    if (e.message.includes('Failed to fetch')) {
      throw new Error('Servidor offline. Inicie com: node server.js');
    }
    throw e;
  }
}

/* ---- Toast ---- */
function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white border-0 mb-2 ${type === 'success' ? 'toast-success' : 'toast-error'}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'x-circle-fill'}"></i>
        <span>${msg}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(toast);
  const bst = new bootstrap.Toast(toast, { delay: 4000 });
  bst.show();
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

/* ---- Badge de estoque ---- */
function stockBadge(qty, min) {
  if (qty === 0)    return '<span class="badge-zero"><i class="bi bi-x-circle-fill"></i>Sem Estoque</span>';
  if (qty <= min)   return `<span class="badge-baixo"><i class="bi bi-exclamation-triangle-fill"></i>Baixo</span>`;
  return `<span class="badge-ok"><i class="bi bi-check-circle-fill"></i>Normal</span>`;
}

/* ---- Toggle sidebar (mobile) ---- */
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay && overlay.classList.toggle('active');
}

/* ---- Active nav ---- */
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
    const href = el.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) el.classList.add('active');
  });
}

/* ---- Data no topbar ---- */
function setTopbarDate() {
  const el = document.getElementById('topbarDate');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

/* ---- Número animado ---- */
function animateNumber(el, target) {
  if (!el) return;
  let start = 0;
  const steps = 30;
  const inc   = target / steps;
  const iv    = setInterval(() => {
    start += inc;
    if (start >= target) { el.textContent = Number.isInteger(target) ? target : target.toFixed(0); clearInterval(iv); return; }
    el.textContent = Math.floor(start);
  }, 16);
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  setTopbarDate();

  // Fechar sidebar ao clicar no overlay
  const overlay = document.getElementById('sidebarOverlay');
  overlay?.addEventListener('click', toggleSidebar);
});
