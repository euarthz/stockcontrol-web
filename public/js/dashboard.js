/* ============================================================
   StockControl Web – Dashboard
   ============================================================ */

async function loadDashboard() {
  try {
    const d = await apiRequest('/dashboard');

    // Stat cards com animação
    animateNumber(document.getElementById('valTotalProdutos'),    d.total_produtos);
    animateNumber(document.getElementById('valTotalEstoque'),     d.total_itens_estoque);
    animateNumber(document.getElementById('valTotalNotas'),       d.total_notas);
    animateNumber(document.getElementById('valBaixoEstoque'),     d.produtos_baixo_estoque.length);

    // Tabela: estoque baixo
    const tbBaixo = document.querySelector('#tblBaixoEstoque tbody');
    if (d.produtos_baixo_estoque.length === 0) {
      tbBaixo.innerHTML = `<tr><td colspan="5"><div class="empty-state">
        <i class="bi bi-check2-circle text-success"></i>
        <h6>Nenhum produto com estoque baixo!</h6>
      </div></td></tr>`;
    } else {
      tbBaixo.innerHTML = d.produtos_baixo_estoque.map(p => `
        <tr class="fade-in">
          <td><span class="mono">${p.codigo || '–'}</span></td>
          <td><strong>${p.nome}</strong></td>
          <td><span class="chip">${p.categoria || '–'}</span></td>
          <td><strong class="${p.quantidade === 0 ? 'text-danger' : 'text-warning'}">${p.quantidade}</strong></td>
          <td>${stockBadge(p.quantidade, p.quantidade_minima)}</td>
        </tr>`).join('');
    }

    // Tabela: últimas NFs
    const tbNotas = document.querySelector('#tblUltimasNotas tbody');
    if (d.ultimas_notas.length === 0) {
      tbNotas.innerHTML = `<tr><td colspan="4"><div class="empty-state">
        <i class="bi bi-receipt"></i><h6>Nenhuma nota cadastrada</h6>
      </div></td></tr>`;
    } else {
      tbNotas.innerHTML = d.ultimas_notas.map(n => `
        <tr class="fade-in">
          <td><strong class="text-primary">${n.numero_nf}</strong></td>
          <td>${n.fornecedor || '–'}</td>
          <td>${formatDate(n.data_emissao)}</td>
          <td><strong>${formatBRL(n.valor_total)}</strong></td>
        </tr>`).join('');
    }

    // Tabela: últimas movimentações
    const tbMov = document.querySelector('#tblMovimentacoes tbody');
    if (d.ultimas_movimentacoes.length === 0) {
      tbMov.innerHTML = `<tr><td colspan="5"><div class="empty-state">
        <i class="bi bi-arrow-left-right"></i><h6>Nenhuma movimentação</h6>
      </div></td></tr>`;
    } else {
      tbMov.innerHTML = d.ultimas_movimentacoes.map(m => `
        <tr class="fade-in">
          <td class="text-muted" style="font-size:.8rem">${formatDateTime(m.created_at)}</td>
          <td><strong>${m.produto_nome}</strong></td>
          <td><span class="badge-${m.tipo}">${m.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}</span></td>
          <td><strong>${m.quantidade}</strong></td>
          <td>${m.motivo || '–'}</td>
        </tr>`).join('');
    }
  } catch (err) {
    showToast('Erro ao carregar dashboard: ' + err.message, 'error');
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
