StockControl Web

Sistema de Gerenciamento de Estoque e Notas Fiscais  
Tecnologias: Node.js · Express · SQLite3 · Bootstrap 5 · HTML · CSS · JavaScript

---

Como Rodar o Projeto

1. Pré-requisitos

- [Node.js](https://nodejs.org) versão 16 ou superior
- npm (vem junto com o Node.js)

2. Instalar as Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

3. Iniciar o Servidor

```bash
npm start
```

Ou, para desenvolvimento com reinicialização automática:

```bash
npm run dev
```

4. Acessar no Navegador

Abra: **http://localhost:3000**

---

Estrutura do Projeto

```
stockcontrol/
├── server.js               ← Servidor Express + rotas da API
├── package.json            ← Configuração e dependências
├── stockcontrol.db         ← Banco de dados SQLite (criado automaticamente)
└── public/
    ├── index.html          ← Dashboard
    ├── produtos.html       ← CRUD de Produtos
    ├── notas.html          ← Notas Fiscais
    ├── movimentacoes.html  ← Movimentações de Estoque
    ├── css/
    │   └── style.css       ← Estilos globais
    └── js/
        ├── app.js          ← Utilitários compartilhados
        ├── dashboard.js    ← Lógica do Dashboard
        ├── produtos.js     ← Lógica de Produtos (CRUD)
        ├── notas.js        ← Lógica de Notas Fiscais
        └── movimentacoes.js← Lógica de Movimentações
```

---

Funcionalidades

1. Dashboard
- Total de produtos cadastrados
- Total de itens em estoque
- Notas fiscais registradas
- Alerta de produtos com estoque baixo
- Últimas notas fiscais recebidas
- Últimas movimentações (entradas e saídas)

2. CRUD de Produtos
| Operação | Descrição |
|----------|-----------|
| Create | Cadastrar produto com código, nome, categoria, preço, quantidade e quantidade mínima |
| Read | Listar todos os produtos com busca por nome/código e filtro por categoria |
| Update | Editar qualquer informação do produto |
| Delete | Excluir produto do sistema |

3. Notas Fiscais de Entrada
- Cadastro com: número da NF, fornecedor, data, valor total, observações
- Adição de múltiplos produtos por nota
- **Atualização automática do estoque** ao salvar a NF
- **Registro automático de movimentação** (entrada)
- Visualização detalhada dos itens de cada NF
- Exclusão de NFs (estoque não é revertido)

4. Movimentações de Estoque
- Entradas geradas automaticamente via NF
- Saídas manuais (venda, consumo, perda, devolução)
- Histórico completo: quantidade antes × depois
- Motivo de cada movimentação

---

Banco de Dados

Arquivo SQLite criado automaticamente em `stockcontrol.db`.

Tabelas

| Tabela | Descrição |
|--------|-----------|
| `produtos` | Cadastro de produtos |
| `notas_fiscais` | Cabeçalho das notas de entrada |
| `itens_nf` | Itens de cada nota fiscal |
| `movimentacoes` | Histórico de entradas e saídas |
| `fornecedores` | Cadastro de fornecedores (para expansão futura) |

---

Rotas da API

Produtos
```
GET    /api/produtos          → Listar (aceita ?search= e ?categoria=)
GET    /api/produtos/:id      → Buscar por ID
POST   /api/produtos          → Criar novo produto
PUT    /api/produtos/:id      → Atualizar produto
DELETE /api/produtos/:id      → Excluir produto
GET    /api/categorias        → Listar categorias distintas
```

Fiscais
```
GET    /api/notas             → Listar todas as notas
GET    /api/notas/:id         → Buscar nota com itens
POST   /api/notas             → Criar nota (atualiza estoque automaticamente)
DELETE /api/notas/:id         → Excluir nota
```

Movimentações
```
GET    /api/movimentacoes       → Listar histórico (últimas 200)
POST   /api/movimentacoes/saida → Registrar saída manual
```

Dashboard
```
GET    /api/dashboard         → Estatísticas e resumos
```

---

Tecnologias Utilizadas

| Camada | Tecnologia |
| Front-End | HTML5, CSS3, JavaScript (ES6+) |
| UI Framework | Bootstrap 5.3 |
| Ícones | Bootstrap Icons 1.11 |
| Fontes | Google Fonts (Sora + DM Sans) |
| Back-End | Node.js + Express 4 |
| Banco de Dados | SQLite3 |

---

Público-Alvo

Mercados · Lojas de materiais de construção · Autopeças · Distribuidoras · Pequenas empresas

---

Dados de Exemplo

Colocamos o sistema já com 10 produtos de exemplo para demonstração. 

