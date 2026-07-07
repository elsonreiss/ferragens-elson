# Ferragens do Elson — Sistema de Gestão (ERP)

Sistema web de gestão para a Ferragens do Elson: estoque, vendas, compras,
financeiro, clientes, fornecedores e relatórios. Este é o **início do projeto**:
a base da arquitetura, o Dashboard e o módulo de Estoque completos e funcionando.
Os demais módulos (Clientes, Fornecedores, Vendas, Compras, Orçamentos,
Relatórios) aparecem no menu marcados como "em breve" e serão construídos por
cima desta mesma base, um de cada vez.

## Stack escolhida

- **Next.js 16 (App Router) + React 19 + TypeScript** — framework moderno,
  performático, com Server Components (menos JS no navegador) e API Routes
  já embutidas (não precisa de um backend separado).
- **Tailwind CSS v4** — estilização rápida e consistente.
- **PostgreSQL** (via o pacote `pg`) — banco de dados relacional gerenciado,
  necessário para rodar em produção na Vercel (o sistema de arquivos da
  Vercel é temporário/somente leitura, então um arquivo local como o SQLite
  não sobrevive entre requisições). Ver seção "Banco de dados (PostgreSQL)"
  abaixo para como configurar.
- **Recharts** — gráficos do Dashboard.
- **Lucide** — ícones.

## Arquitetura (Clean Architecture)

O código é organizado em camadas independentes, para que regras de negócio
nunca fiquem presas a uma tecnologia específica de banco ou de interface:

```
src/
  domain/            → Regras e contratos puros (sem depender de nada externo)
    entities/           Product, Category, Supplier, StockMovement, Dashboard...
    repositories/        Interfaces (contratos) que a infraestrutura implementa

  application/        → Casos de uso (regras de negócio orquestradas)
    use-cases/
      product/          Criar/editar/excluir produto, movimentar estoque
      dashboard/        Montar o resumo do dashboard

  infrastructure/      → Implementação concreta (troca sem afetar o resto)
    db/                 Conexão PostgreSQL (pg.Pool) + migrations + seed
    repositories/       Implementações dos contratos do domínio (Postgres)

  container.ts         → Ponto único que conecta infraestrutura às use-cases
                          (para trocar de banco, só mexe aqui)

  components/          → Interface (UI)
    ui/                 Componentes genéricos (Button, Card, Modal, Form...)
    layout/             Sidebar, Topbar
    dashboard/          Cards, gráficos, listas do Dashboard
    estoque/            Tabela de produtos, formulário, histórico

  app/                 → Páginas e rotas de API (Next.js App Router)
    dashboard/          Página do Dashboard
    estoque/            Listagem, cadastro e edição de produtos
    api/                Rotas de API (products, categories, suppliers, dashboard)
```

**Por que isso importa na prática:** se um dia você quiser trocar de banco de
dados ou de provedor, basta implementar as mesmas interfaces de
`domain/repositories/` numa nova pasta e trocar a instância em
`container.ts` — nada mais no sistema precisa mudar, nem as páginas, nem os
componentes.

## Banco de dados (PostgreSQL)

O sistema usa PostgreSQL. Você precisa de um banco Postgres e passar a
connection string dele na variável de ambiente `DATABASE_URL`.

Para desenvolvimento local ou para usar de graça na sua loja, o mais simples
é criar um banco gratuito em um destes provedores (nenhum pede cartão de
crédito no plano free):

1. **[Neon](https://neon.tech)** (recomendado) — crie uma conta, crie um
   projeto, copie a "Connection string" (formato
   `postgresql://usuario:senha@host/banco?sslmode=require`).
2. **[Supabase](https://supabase.com)** — crie um projeto, em
   Project Settings → Database copie a "Connection string" (use a versão
   "Connection pooling" se for usar na Vercel).

Crie um arquivo `.env.local` na raiz do projeto:

```bash
DATABASE_URL="postgresql://usuario:senha@host/banco?sslmode=require"
```

Na primeira requisição, o sistema cria automaticamente todas as tabelas e
popula o banco com **categorias, fornecedores, produtos, clientes de
exemplo** e o usuário administrador padrão, para você já ver tudo
funcionando.

## Como rodar o projeto

Pré-requisitos: **Node.js 20+** e um banco Postgres configurado (veja acima).

```bash
npm install
npm run dev
```

Acesse **http://localhost:3000** — você será redirecionado para `/dashboard`.

Para gerar a versão de produção:

```bash
npm run build
npm run start
```

## Login

O sistema agora exige login. Um usuário administrador é criado automaticamente
na primeira execução:

- **E-mail:** `elsonreis084@gmail.com`
- **Senha:** `elson123`

Troque essa senha assim que possível em **Configurações → Usuários**, onde
também é possível criar outros usuários com papéis de Administrador, Gerente
ou Funcionário.

## O que já funciona

### Dashboard (`/dashboard`)
- Cards: total de produtos, valor em estoque, produtos em falta/estoque baixo,
  vendido hoje/mês, lucro do dia/mês, gastos do mês, orçamentos realizados.
- Gráfico de faturamento com abas Diário / Semanal / Mensal.
- Produtos mais vendidos, clientes que mais compram, últimas vendas.
- Painel de alertas (estoque baixo/em falta).
- Modo claro/escuro (alterna e salva a preferência).

### Estoque (`/estoque`)
- Listagem com busca em tempo real, filtro por categoria e por status
  (em falta / estoque baixo / ok), com preço de compra e venda visíveis.
- Cadastro completo de produto: código, código de barras, nome, categoria,
  marca, unidade, descrição, preço de compra/venda (com margem calculada
  automaticamente), estoque mínimo, quantidade, localização no depósito,
  fornecedor.
- **Movimentação de estoque** (entrada, saída, ajuste de inventário) —
  atualiza a quantidade automaticamente e registra histórico completo.
- Edição e exclusão de produtos.
- Alertas automáticos de estoque baixo/em falta, refletidos no Dashboard.

### Clientes e Fornecedores
- Cadastro completo (dados de contato, endereço, observações), busca e
  exclusão.

### Compras (`/compras`)
- Registro de compra com múltiplos itens por fornecedor. Dá **entrada
  automática no estoque** e atualiza o preço de compra do produto.

### Vendas (`/vendas`)
- Registro de venda com múltiplos itens e cliente. Dá **saída automática no
  estoque**, bloqueia vendas sem estoque suficiente e calcula o **lucro** por
  item (preço de venda − preço de compra).

### Financeiro (`/financeiro`)
- Receitas (vendas) e despesas do mês, saldo, despesas por categoria e
  gráfico de fluxo de caixa dos últimos 14 dias. Cadastro rápido de despesas.

### Orçamentos (`/orcamentos`)
- Criação de orçamento com itens, desconto e validade. Impressão/exportação
  em PDF pelo navegador (botão "Imprimir"), envio por WhatsApp com resumo do
  orçamento, e conversão em venda com um clique (baixa o estoque
  automaticamente).

### Relatórios (`/relatorios`)
- Vendas por período, estoque valorizado, produtos parados (sem saída
  recente) e financeiro dos últimos 6 meses — todos exportáveis em CSV
  (abre direto no Excel).

### Usuários e permissões (`/configuracoes`)
- Login obrigatório para todo o sistema. Papéis Administrador, Gerente e
  Funcionário. Apenas administradores podem gerenciar usuários.

### Pesquisa global
- A busca no topo do sistema retorna produtos, clientes e fornecedores em um
  menu com sugestões, além de levar para a listagem de estoque filtrada.

## Próximos módulos (ainda não implementados)

Seguindo a mesma arquitetura (entidade → repositório → use-case → API → tela):

1. Permissões refinadas por papel (esconder/bloquear ações específicas para
   Funcionário e Gerente).
2. Geração de PDF real (hoje é via impressão do navegador) e envio de
   orçamento por e-mail.
3. Edição/exclusão de vendas e compras já lançadas.

## Deploy

- **Frontend + API (Next.js):** Vercel é o caminho mais simples (mesma
  empresa por trás do Next.js, zero configuração).
- **Banco de dados:** crie um banco gratuito no [Neon](https://neon.tech) ou
  [Supabase](https://supabase.com) (veja "Banco de dados (PostgreSQL)"
  acima) e adicione a `DATABASE_URL` nas variáveis de ambiente do projeto na
  Vercel (Project Settings → Environment Variables). Não é preciso nenhuma
  configuração adicional — o próprio sistema cria as tabelas e os dados de
  exemplo na primeira requisição.
