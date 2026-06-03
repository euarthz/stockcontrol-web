/* ============================================================
   StockControl Web – Produtos (CRUD)
   ============================================================ */

let editingId  = null;
let allProdutos = [];

/* ---- LISTAR ---- */
async function loadProdutos(search = '', categoria = '') {
  const tbody = document.querySelector('#tblProdutos tbody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
    <div class="spinner-border spinner-border-sm me-2"></div>Carregando...</td></tr>`;
  try {
    const qs = new URLSearchParams();
    if (search)    qs.set('search',    search);
    if (categoria) qs.set('categoria', categoria);
    allProdutos = await apiRequest('/produtos?' + qs.toString());
    renderTabela();
  } catch (e) { showToast(e.message, 'error'); }
}

function renderTabela() {
  const tbody = document.querySelector('#tblProdutos tbody');
  if (!allProdutos.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
      <i class="bi bi-box2"></i>
      <h6>Nenhum produto encontrado</h6>
      <p>Cadastre seu primeiro produto clicando em "Novo Produto"</p>
    </div></td></tr>`;
    return;
  }
  tbody.innerHTML = allProdutos.map((p, i) => `
    <tr class="fade-in" style="animation-delay:${i * 0.03}s">
      <td><span class="mono">${p.codigo || '–'}</span></td>
      <td>
        <div style="font-weight:600">${p.nome}</div>
      </td>
      <td><span class="chip">${p.categoria || '–'}</span></td>
      <td>${formatBRL(p.preco)}</td>
      <td>
        <strong class="${p.quantidade === 0 ? 'text-danger' : p.quantidade <= p.quantidade_minima ? 'text-warning' : ''}">${p.quantidade}</strong>
        <span style="color:var(--text-muted);font-size:.75rem"> / min ${p.quantidade_minima}</span>
      </td>
      <td>${stockBadge(p.quantidade, p.quantidade_minima)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-xs me-1" onclick="abrirEditar(${p.id})" title="Editar">
          <i class="bi bi-pencil-fill"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger btn-xs" onclick="excluirProduto(${p.id}, '${p.nome.replace(/'/g,"\\'")}')">
          <i class="bi bi-trash3-fill"></i>
        </button>
      </td>
    </tr>`).join('');

  document.getElementById('countProdutos').textContent = `${allProdutos.length} produto${allProdutos.length !== 1 ? 's' : ''}`;
}

/* ---- ABRIR MODAL NOVO ---- */
function abrirNovo() {
  editingId = null;
  document.getElementById('modalTitulo').textContent = 'Novo Produto';
  document.getElementById('frmProduto').reset();
  document.getElementById('campoQtdMin').value = 5;
  const m = new bootstrap.Modal(document.getElementById('modalProduto'));
  m.show();
}

/* ---- ABRIR MODAL EDITAR ---- */
async function abrirEditar(id) {
  try {
    const p = await apiRequest('/produtos/' + id);
    editingId = id;
    document.getElementById('modalTitulo').textContent    = 'Editar Produto';
    document.getElementById('campoCodigo').value          = p.codigo        || '';
    document.getElementById('campoNome').value            = p.nome;
    document.getElementById('campoCategoria').value       = p.categoria     || '';
    document.getElementById('campoPreco').value           = p.preco;
    document.getElementById('campoQtd').value             = p.quantidade;
    document.getElementById('campoQtdMin').value          = p.quantidade_minima;
    const m = new bootstrap.Modal(document.getElementById('modalProduto'));
    m.show();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ---- SALVAR ---- */
async function salvarProduto() {
  const nome = document.getElementById('campoNome').value.trim();
  if (!nome) { showToast('Nome do produto é obrigatório!', 'error'); return; }

  const data = {
    codigo:            document.getElementById('campoCodigo').value.trim(),
    nome,
    categoria:         document.getElementById('campoCategoria').value.trim(),
    preco:             parseFloat(document.getElementById('campoPreco').value)   || 0,
    quantidade:        parseInt(document.getElementById('campoQtd').value)       || 0,
    quantidade_minima: parseInt(document.getElementById('campoQtdMin').value)    || 5,
  };

  const btn = document.getElementById('btnSalvarProd');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Salvando…';

  try {
    if (editingId) {
      await apiRequest('/produtos/' + editingId, 'PUT', data);
      showToast('Produto atualizado com sucesso!');
    } else {
      await apiRequest('/produtos', 'POST', data);
      showToast('Produto cadastrado com sucesso!');
    }
    bootstrap.Modal.getInstance(document.getElementById('modalProduto')).hide();
    loadProdutos(
      document.getElementById('buscaInput')?.value || '',
      document.getElementById('filtroCategoria')?.value || ''
    );
    loadCategorias();
  } catch (e) { showToast('Erro: ' + e.message, 'error'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Produto';
  }
}

/* ---- EXCLUIR ---- */
async function excluirProduto(id, nome) {
  if (!confirm(`Excluir o produto "${nome}"?\n\nEsta ação não pode ser desfeita.`)) return;
  try {
    await apiRequest('/produtos/' + id, 'DELETE');
    showToast('Produto excluído!');
    loadProdutos();
  } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

/* ---- CATEGORIAS (filtro) ---- */
async function loadCategorias() {
  try {
    const cats  = await apiRequest('/categorias');
    const sel   = document.getElementById('filtroCategoria');
    if (!sel) return;
    const atual = sel.value;
    sel.innerHTML = '<option value="">Todas as categorias</option>' +
      cats.map(c => `<option value="${c}" ${c === atual ? 'selected' : ''}>${c}</option>`).join('');
  } catch (_) {}
}

/* ---- EVENTOS ---- */
let buscaTimer;
document.getElementById('buscaInput')?.addEventListener('input', e => {
  clearTimeout(buscaTimer);
  buscaTimer = setTimeout(() => {
    loadProdutos(e.target.value, document.getElementById('filtroCategoria')?.value || '');
  }, 300);
});

document.getElementById('filtroCategoria')?.addEventListener('change', e => {
  loadProdutos(document.getElementById('buscaInput')?.value || '', e.target.value);
});

document.addEventListener('DOMContentLoaded', () => {
  loadProdutos();
  loadCategorias();
});
