/* ============================================================
   StockControl Web – Notas Fiscais
   ============================================================ */

let produtosCache = [];
let itensNF       = [];

/* ---- LISTAR NOTAS ---- */
async function loadNotas() {
  const tbody = document.querySelector('#tblNotas tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">
    <div class="spinner-border spinner-border-sm me-2"></div>Carregando…</td></tr>`;
  try {
    const notas = await apiRequest('/notas');
    if (!notas.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
        <i class="bi bi-receipt"></i>
        <h6>Nenhuma nota fiscal cadastrada</h6>
        <p>Clique em "Nova Nota Fiscal" para começar</p>
      </div></td></tr>`;
      return;
    }
    tbody.innerHTML = notas.map((n, i) => `
      <tr class="fade-in" style="animation-delay:${i*0.03}s">
        <td><strong class="text-primary" style="font-family:var(--font-mono)">${n.numero_nf}</strong></td>
        <td>${n.fornecedor || '–'}</td>
        <td>${formatDate(n.data_emissao)}</td>
        <td><strong>${formatBRL(n.valor_total)}</strong></td>
        <td class="text-muted" style="font-size:.8rem">${formatDateTime(n.created_at)}</td>
        <td>
          <button class="btn btn-xs btn-outline-info me-1" onclick="verNota(${n.id})" title="Visualizar">
            <i class="bi bi-eye-fill"></i>
          </button>
          <button class="btn btn-xs btn-outline-danger" onclick="excluirNota(${n.id},'${n.numero_nf}')" title="Excluir">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </td>
      </tr>`).join('');
  } catch (e) { showToast(e.message, 'error'); }
}

/* ---- CARREGAR PRODUTOS PARA O SELECT ---- */
async function carregarProdutos() {
  try {
    produtosCache = await apiRequest('/produtos');
  } catch (_) {}
}

/* ---- ABRIR MODAL NOVA NF ---- */
function abrirNovaNF() {
  itensNF = [];
  document.getElementById('frmNF').reset();
  document.getElementById('dataEmissao').value = new Date().toISOString().split('T')[0];
  document.getElementById('valorTotalNF').value = '0.00';
  renderItens();
  adicionarItem();
  new bootstrap.Modal(document.getElementById('modalNF')).show();
}

/* ---- GERENCIAR ITENS DA NF ---- */
function adicionarItem() {
  itensNF.push({ _id: Date.now(), produto_id: '', quantidade: 1, preco_unitario: 0 });
  renderItens();
}

function removerItem(tempId) {
  itensNF = itensNF.filter(i => i._id !== tempId);
  renderItens();
  calcularTotal();
}

function renderItens() {
  const container = document.getElementById('containerItens');
  if (!itensNF.length) {
    container.innerHTML = '<p class="text-muted text-center py-3 mb-0"><i class="bi bi-info-circle me-1"></i>Nenhum item. Clique em "Adicionar Item".</p>';
    return;
  }
  container.innerHTML = itensNF.map(item => `
    <div class="item-row" id="itemRow_${item._id}">
      <div class="row g-2 align-items-end">
        <div class="col-md-5">
          <label class="form-label">Produto *</label>
          <select class="form-select form-select-sm" onchange="onProdutoChange(${item._id},this.value)">
            <option value="">— selecione —</option>
            ${produtosCache.map(p =>
              `<option value="${p.id}" data-preco="${p.preco}"
               ${item.produto_id == p.id ? 'selected' : ''}>
               ${p.nome} (estoque: ${p.quantidade})
              </option>`).join('')}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Quantidade *</label>
          <input type="number" class="form-control form-control-sm" min="1" value="${item.quantidade}"
            oninput="onQtdChange(${item._id},this.value)">
        </div>
        <div class="col-md-3">
          <label class="form-label">Preço Unitário (R$)</label>
          <input type="number" class="form-control form-control-sm" step="0.01" min="0"
            value="${item.preco_unitario}" oninput="onPrecoChange(${item._id},this.value)">
        </div>
        <div class="col-md-1 text-center">
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="removerItem(${item._id})"
            title="Remover item" style="width:32px;height:32px;padding:0">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
    </div>`).join('');
}

function onProdutoChange(tempId, prodId) {
  const item    = itensNF.find(i => i._id === tempId);
  const produto = produtosCache.find(p => p.id == prodId);
  if (!item) return;
  item.produto_id     = prodId;
  item.preco_unitario = produto ? parseFloat(produto.preco) : 0;

  // Atualizar campo de preço no DOM
  const row = document.getElementById('itemRow_' + tempId);
  if (row) row.querySelectorAll('input[type=number]')[1].value = item.preco_unitario.toFixed(2);
  calcularTotal();
}

function onQtdChange(tempId, val) {
  const item = itensNF.find(i => i._id === tempId);
  if (item) { item.quantidade = parseInt(val) || 1; calcularTotal(); }
}

function onPrecoChange(tempId, val) {
  const item = itensNF.find(i => i._id === tempId);
  if (item) { item.preco_unitario = parseFloat(val) || 0; calcularTotal(); }
}

function calcularTotal() {
  const total = itensNF.reduce((s, i) => s + (i.quantidade * i.preco_unitario), 0);
  const el    = document.getElementById('valorTotalNF');
  if (el) el.value = total.toFixed(2);
}

/* ---- SALVAR NF ---- */
async function salvarNF() {
  const numero_nf = document.getElementById('numeroNF').value.trim();
  if (!numero_nf) { showToast('Número da NF é obrigatório!', 'error'); return; }

  const itensValidos = itensNF.filter(i => i.produto_id && i.quantidade > 0);
  if (!itensValidos.length) { showToast('Adicione ao menos um item com produto selecionado!', 'error'); return; }

  const data = {
    numero_nf,
    fornecedor:   document.getElementById('fornecedorNF').value.trim(),
    data_emissao: document.getElementById('dataEmissao').value,
    valor_total:  parseFloat(document.getElementById('valorTotalNF').value) || 0,
    observacoes:  document.getElementById('obsNF').value.trim(),
    itens: itensValidos.map(({ produto_id, quantidade, preco_unitario }) =>
      ({ produto_id, quantidade, preco_unitario })),
  };

  const btn = document.getElementById('btnSalvarNF');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Salvando…';

  try {
    await apiRequest('/notas', 'POST', data);
    showToast('✅ Nota fiscal salva! Estoque atualizado automaticamente.');
    bootstrap.Modal.getInstance(document.getElementById('modalNF')).hide();
    loadNotas();
    carregarProdutos(); // Atualizar cache de produtos
  } catch (e) { showToast('Erro: ' + e.message, 'error'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Nota Fiscal';
  }
}

/* ---- VISUALIZAR NF ---- */
async function verNota(id) {
  try {
    const nota = await apiRequest('/notas/' + id);

    document.getElementById('viewNumeroNF').textContent  = nota.numero_nf;
    document.getElementById('viewFornecedor').textContent= nota.fornecedor  || '–';
    document.getElementById('viewData').textContent      = formatDate(nota.data_emissao);
    document.getElementById('viewValor').textContent     = formatBRL(nota.valor_total);
    document.getElementById('viewObs').textContent       = nota.observacoes || '–';

    const tbody = document.querySelector('#tblViewItens tbody');
    tbody.innerHTML = (nota.itens || []).map(it => `
      <tr>
        <td>${it.produto_nome}</td>
        <td class="text-center">${it.quantidade}</td>
        <td>${formatBRL(it.preco_unitario)}</td>
        <td><strong>${formatBRL(it.quantidade * it.preco_unitario)}</strong></td>
      </tr>`).join('') || `<tr><td colspan="4" class="text-muted text-center">Sem itens</td></tr>`;

    new bootstrap.Modal(document.getElementById('modalVerNF')).show();
  } catch (e) { showToast(e.message, 'error'); }
}

/* ---- EXCLUIR NF ---- */
async function excluirNota(id, numero) {
  if (!confirm(`Excluir a Nota Fiscal ${numero}?\n\nAtenção: o estoque NÃO será revertido automaticamente.`)) return;
  try {
    await apiRequest('/notas/' + id, 'DELETE');
    showToast('Nota fiscal excluída!');
    loadNotas();
  } catch (e) { showToast('Erro: ' + e.message, 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
  loadNotas();
  carregarProdutos();
});
