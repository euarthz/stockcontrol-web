// ============================================================
//  StockControl Web – Servidor Principal
//  Node.js + Express + SQLite3
// ============================================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = 3000;

// ---------- Middlewares ----------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Banco de Dados ----------
const db = new sqlite3.Database('./stockcontrol.db', (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados SQLite.');
  initDB();
});

// Helpers: transformar callbacks em Promises
const run = (sql, params = []) =>
  new Promise((res, rej) => db.run(sql, params, function (e) { e ? rej(e) : res(this); }));

const get = (sql, params = []) =>
  new Promise((res, rej) => db.get(sql, params, (e, row) => { e ? rej(e) : res(row); }));

const all = (sql, params = []) =>
  new Promise((res, rej) => db.all(sql, params, (e, rows) => { e ? rej(e) : res(rows); }));

// ---------- Inicializar tabelas ----------
async function initDB() {
  db.run('PRAGMA foreign_keys = ON');

  await run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo            VARCHAR(50),
      nome              VARCHAR(100) NOT NULL,
      categoria         VARCHAR(100),
      preco             DECIMAL(10,2) DEFAULT 0,
      quantidade        INTEGER       DEFAULT 0,
      quantidade_minima INTEGER       DEFAULT 5,
      created_at        DATETIME      DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS fornecedores (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      nome     VARCHAR(100) NOT NULL,
      telefone VARCHAR(20),
      email    VARCHAR(100),
      cnpj     VARCHAR(20)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notas_fiscais (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_nf     VARCHAR(20)    NOT NULL,
      fornecedor    VARCHAR(100),
      data_emissao  DATE,
      valor_total   DECIMAL(10,2) DEFAULT 0,
      observacoes   TEXT,
      created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS itens_nf (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nota_id         INTEGER NOT NULL,
      produto_id      INTEGER NOT NULL,
      quantidade      INTEGER NOT NULL,
      preco_unitario  DECIMAL(10,2) DEFAULT 0,
      FOREIGN KEY (nota_id)    REFERENCES notas_fiscais(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS movimentacoes (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id          INTEGER NOT NULL,
      tipo                VARCHAR(10) NOT NULL,
      quantidade          INTEGER     NOT NULL,
      quantidade_anterior INTEGER,
      quantidade_nova     INTEGER,
      motivo              VARCHAR(200),
      nota_id             INTEGER,
      created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    )
  `);

  console.log('✅ Tabelas verificadas/criadas.');
  await seedData();
}

// ---------- Dados de Exemplo ----------
async function seedData() {
  const { count } = await get('SELECT COUNT(*) as count FROM produtos');
  if (count > 0) return;

  const prods = [
    ['PROD001', 'Arroz Tipo 1 (5kg)',       'Alimentos',  25.90, 150, 20],
    ['PROD002', 'Feijão Carioca (1kg)',      'Alimentos',   8.50,  80, 15],
    ['PROD003', 'Açúcar Refinado (2kg)',     'Alimentos',  12.90,  60, 10],
    ['PROD004', 'Óleo de Soja 900ml',        'Alimentos',   7.80,  45, 10],
    ['PROD005', 'Sal Refinado (1kg)',        'Alimentos',   3.50,   8, 15],
    ['PROD006', 'Macarrão Espaguete 500g',   'Alimentos',   4.20,  95, 20],
    ['PROD007', 'Leite Integral 1L',         'Laticínios',  5.90,  40, 12],
    ['PROD008', 'Café Torrado Moído 500g',   'Bebidas',    18.90,  30, 10],
    ['PROD009', 'Detergente Líquido 500ml',  'Limpeza',     2.80,  60, 15],
    ['PROD010', 'Papel Higiênico 12un',      'Higiene',    22.90,   5, 10],
  ];

  for (const p of prods) {
    await run(
      'INSERT INTO produtos (codigo,nome,categoria,preco,quantidade,quantidade_minima) VALUES (?,?,?,?,?,?)',
      p
    );
  }
  console.log('✅ Dados de exemplo inseridos.');
}

// ============================================================
//  ROTAS – PRODUTOS
// ============================================================

// Listar produtos (com busca e filtro)
app.get('/api/produtos', async (req, res) => {
  try {
    const { search, categoria } = req.query;
    let sql    = 'SELECT * FROM produtos';
    const args = [];
    const cond = [];

    if (search) {
      cond.push('(nome LIKE ? OR codigo LIKE ?)');
      args.push(`%${search}%`, `%${search}%`);
    }
    if (categoria) {
      cond.push('categoria = ?');
      args.push(categoria);
    }
    if (cond.length) sql += ' WHERE ' + cond.join(' AND ');
    sql += ' ORDER BY nome';

    res.json(await all(sql, args));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Buscar produto por ID
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM produtos WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Criar produto
app.post('/api/produtos', async (req, res) => {
  try {
    const { codigo, nome, categoria, preco, quantidade, quantidade_minima } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome do produto é obrigatório' });

    const result = await run(
      'INSERT INTO produtos (codigo,nome,categoria,preco,quantidade,quantidade_minima) VALUES (?,?,?,?,?,?)',
      [codigo, nome, categoria, preco || 0, quantidade || 0, quantidade_minima || 5]
    );
    res.status(201).json({ id: result.lastID, message: 'Produto cadastrado com sucesso!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { codigo, nome, categoria, preco, quantidade, quantidade_minima } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome do produto é obrigatório' });

    const result = await run(
      'UPDATE produtos SET codigo=?,nome=?,categoria=?,preco=?,quantidade=?,quantidade_minima=? WHERE id=?',
      [codigo, nome, categoria, preco, quantidade, quantidade_minima, req.params.id]
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ message: 'Produto atualizado com sucesso!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Excluir produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM produtos WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ message: 'Produto excluído com sucesso!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Listar categorias distintas
app.get('/api/categorias', async (req, res) => {
  try {
    const rows = await all(
      'SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL AND categoria != "" ORDER BY categoria'
    );
    res.json(rows.map(r => r.categoria));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
//  ROTAS – NOTAS FISCAIS
// ============================================================

// Listar notas fiscais
app.get('/api/notas', async (req, res) => {
  try {
    res.json(await all('SELECT * FROM notas_fiscais ORDER BY created_at DESC'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Buscar nota com itens
app.get('/api/notas/:id', async (req, res) => {
  try {
    const nota = await get('SELECT * FROM notas_fiscais WHERE id = ?', [req.params.id]);
    if (!nota) return res.status(404).json({ error: 'Nota fiscal não encontrada' });

    const itens = await all(
      `SELECT i.*, p.nome AS produto_nome, p.codigo AS produto_codigo
         FROM itens_nf i
         JOIN produtos p ON i.produto_id = p.id
        WHERE i.nota_id = ?`,
      [req.params.id]
    );
    res.json({ ...nota, itens });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Criar nota fiscal (e atualizar estoque automaticamente)
app.post('/api/notas', async (req, res) => {
  const { numero_nf, fornecedor, data_emissao, valor_total, observacoes, itens } = req.body;

  if (!numero_nf)                   return res.status(400).json({ error: 'Número da NF é obrigatório' });
  if (!itens || itens.length === 0) return res.status(400).json({ error: 'A nota deve conter ao menos um item' });

  try {
    await run('BEGIN TRANSACTION');

    // 1. Inserir a nota
    const notaResult = await run(
      'INSERT INTO notas_fiscais (numero_nf,fornecedor,data_emissao,valor_total,observacoes) VALUES (?,?,?,?,?)',
      [numero_nf, fornecedor, data_emissao, valor_total || 0, observacoes]
    );
    const notaId = notaResult.lastID;

    // 2. Para cada item: inserir, atualizar estoque, registrar movimentação
    for (const item of itens) {
      const produto = await get('SELECT * FROM produtos WHERE id = ?', [item.produto_id]);
      if (!produto) throw new Error(`Produto ID ${item.produto_id} não encontrado`);

      await run(
        'INSERT INTO itens_nf (nota_id,produto_id,quantidade,preco_unitario) VALUES (?,?,?,?)',
        [notaId, item.produto_id, item.quantidade, item.preco_unitario || 0]
      );

      const qtdAnterior = produto.quantidade;
      const qtdNova     = qtdAnterior + parseInt(item.quantidade);

      await run('UPDATE produtos SET quantidade = ? WHERE id = ?', [qtdNova, item.produto_id]);

      await run(
        `INSERT INTO movimentacoes
           (produto_id,tipo,quantidade,quantidade_anterior,quantidade_nova,motivo,nota_id)
         VALUES (?,?,?,?,?,?,?)`,
        [item.produto_id, 'entrada', item.quantidade, qtdAnterior, qtdNova, `Entrada NF ${numero_nf}`, notaId]
      );
    }

    await run('COMMIT');
    res.status(201).json({ id: notaId, message: 'Nota fiscal cadastrada! Estoque atualizado automaticamente.' });
  } catch (e) {
    await run('ROLLBACK').catch(() => {});
    res.status(500).json({ error: e.message });
  }
});

// Excluir nota fiscal
app.delete('/api/notas/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM notas_fiscais WHERE id = ?', [req.params.id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Nota fiscal não encontrada' });
    res.json({ message: 'Nota fiscal excluída com sucesso!' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
//  ROTAS – MOVIMENTAÇÕES
// ============================================================

// Listar movimentações
app.get('/api/movimentacoes', async (req, res) => {
  try {
    const rows = await all(
      `SELECT m.*, p.nome AS produto_nome, p.codigo AS produto_codigo
         FROM movimentacoes m
         JOIN produtos p ON m.produto_id = p.id
        ORDER BY m.created_at DESC
        LIMIT 200`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Registrar saída manual
app.post('/api/movimentacoes/saida', async (req, res) => {
  try {
    const { produto_id, quantidade, motivo } = req.body;
    if (!produto_id || !quantidade)
      return res.status(400).json({ error: 'Produto e quantidade são obrigatórios' });

    const produto = await get('SELECT * FROM produtos WHERE id = ?', [produto_id]);
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    if (produto.quantidade < quantidade)
      return res.status(400).json({ error: `Estoque insuficiente. Disponível: ${produto.quantidade}` });

    const qtdAnterior = produto.quantidade;
    const qtdNova     = qtdAnterior - parseInt(quantidade);

    await run('UPDATE produtos SET quantidade = ? WHERE id = ?', [qtdNova, produto_id]);
    await run(
      `INSERT INTO movimentacoes
         (produto_id,tipo,quantidade,quantidade_anterior,quantidade_nova,motivo)
       VALUES (?,?,?,?,?,?)`,
      [produto_id, 'saida', quantidade, qtdAnterior, qtdNova, motivo || 'Saída manual']
    );

    res.status(201).json({ message: 'Saída registrada com sucesso!', novo_estoque: qtdNova });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
//  ROTA – DASHBOARD
// ============================================================

app.get('/api/dashboard', async (req, res) => {
  try {
    const { total: total_produtos }       = await get('SELECT COUNT(*)    AS total FROM produtos');
    const { total: total_itens_estoque }  = await get('SELECT COALESCE(SUM(quantidade),0) AS total FROM produtos');
    const { total: total_notas }          = await get('SELECT COUNT(*)    AS total FROM notas_fiscais');
    const { total: total_movimentacoes }  = await get('SELECT COUNT(*)    AS total FROM movimentacoes');

    const ultimas_notas = await all(
      'SELECT * FROM notas_fiscais ORDER BY created_at DESC LIMIT 5'
    );
    const produtos_baixo_estoque = await all(
      'SELECT * FROM produtos WHERE quantidade <= quantidade_minima ORDER BY quantidade ASC LIMIT 10'
    );
    const ultimas_movimentacoes = await all(
      `SELECT m.*, p.nome AS produto_nome
         FROM movimentacoes m
         JOIN produtos p ON m.produto_id = p.id
        ORDER BY m.created_at DESC LIMIT 10`
    );

    res.json({
      total_produtos,
      total_itens_estoque,
      total_notas,
      total_movimentacoes,
      ultimas_notas,
      produtos_baixo_estoque,
      ultimas_movimentacoes,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- Iniciar servidor ----------
app.listen(PORT, () => {
  console.log(`\n🚀 StockControl Web rodando em http://localhost:${PORT}\n`);
});
