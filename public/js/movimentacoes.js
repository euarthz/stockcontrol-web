/* ============================================================
   StockControl Web – Movimentações de Estoque
   ============================================================ */

/* ---- LISTAR MOVIMENTAÇÕES ---- */
async function loadMovimentacoes() {
  const tbody = document.querySelector('#tblMovs tbody');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">
    <div class="spinner-border spinner-border-sm me-2"></div>Carregando…</td></tr>`;
  try {
    const movs = await apiRequest('/movimentacoes');
    if (!movs.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <i class="bi bi-arrow-left-right"></i>
        <h6>Nenhuma movimentação registrada</h6>
        <p>As movimentações aparecem automaticamente ao registrar NFs ou saídas</p>
      </div></td></tr>`;
      return;
    }
    tbody.innerHTML = movs.map((m, i) => `
      <tr class="fade-in" style="animation-delay:${i * 0.02}s">
        <td style="font-size:.78rem;color:var(--text-muted)">${formatDateTime(m.created_at)}</td>
        <td>
          <div style="font-weight:600">${m.produto_nome}</div>
          <span class="mono">${m.produto_codigo || '–'}</span>
        </td>
        <td><span class="badge-${m.tipo}">${m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}</span></td>
        <td><strong>${m.quantidade}</strong></td>
        <td style="color:var(--text-muted)">${m.quantidade_anterior ?? '–'}</td>
        <td>
          <strong class="${m.quantidade_nova <= 0 ? 'text-danger' : ''}">${m.quantidade_nova ?? '–'}</strong>
        </td>
        <td style="font-size:.82rem;color:var(--text-muted);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${m.motivo || '–'}
        </td>
      </tr>`).join('');
  } catch (e) { showToast(e.message, 'error'); }
}

/* ---- CARREGAR PRODUTOS PARA SELECT ---- */
async function carregarProdutosSelect() {
  try {
    const produtos = await apiRequest('/produtos');
    const sel = document.getElementById('selProdutoSaida');
    if (!sel) return;
    sel.innerHTML = '<option value="">— selecione um produto —</option>' +
      produtos.map(p =>
        `<option value="${p.id}" data-qtd="${p.quantidade}">
          ${p.nome} &nbsp;|&nbsp; Estoque: ${p.quantidade} un.
        </option>`).join('');
  } catch (_) {}
}

/* ---- ATUALIZAR EXIBIÇÃO DO ESTOQUE ATUAL ---- */
document.getElementById('selProdutoSaida')?.addEventListener('change', function () {
  const opt = this.options[this.selectedIndex];
  const el  = document.getElementById('infoEstoqueAtual');
  if (!el) return;
  if (this.value) {
    const qtd = parseInt(opt.dataset.qtd) || 0;
    el.innerHTML = `<i class="bi bi-box2 me-1"></i>Estoque disponível: <strong>${qtd}</strong> unidade${qtd !== 1 ? 's' : ''}`;
    el.className = qtd === 0 ? 'text-danger mt-1' : qtd <= 5 ? 'text-warning mt-1' : 'text-muted mt-1';
    el.style.fontSize = '.82rem';
  } else {
    el.textContent = '';
  }
});

/* ---- ABRIR MODAL DE SAÍDA ---- */
function abrirModalSaida() {
  document.getElementById('frmSaida').reset();
  const el = document.getElementById('infoEstoqueAtual');
  if (el) el.textContent = '';
  carregarProdutosSelect();
  new bootstrap.Modal(document.getElementById('modalSaida')).show();
}

/* ---- REGISTRAR SAÍDA ---- */
async function registrarSaida() {
  const produto_id = document.getElementById('selProdutoSaida').value;
  const quantidade = parseInt(document.getElementById('qtdSaida').value);
  const motivo     = document.getElementById('motivoSaida').value.trim();

  if (!produto_id)          { showToast('Selecione um produto!', 'error');     return; }
  if (!quantidade || quantidade <= 0) { showToast('Informe uma quantidade válida!', 'error'); return; }

  const btn = document.getElementById('btnRegistrarSaida');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Registrando…';

  try {
    const result = await apiRequest('/movimentacoes/saida', 'POST', {
      produto_id, quantidade, motivo: motivo || 'Saída manual'
    });
    showToast(`Saída registrada! Novo estoque: ${result.novo_estoque} unidade(s)`);
    bootstrap.Modal.getInstance(document.getElementById('modalSaida')).hide();
    loadMovimentacoes();
  } catch (e) { showToast('Erro: ' + e.message, 'error'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-arrow-down-circle me-1"></i>Registrar Saída';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMovimentacoes();
});
