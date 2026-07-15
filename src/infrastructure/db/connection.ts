import { Pool, PoolClient, QueryResultRow, types } from "pg";
import { scryptSync, randomBytes } from "node:crypto";
import fichaProducts from "./seed-data/ficha-products.json";

// Banco de dados PostgreSQL (ex: Neon, Supabase, Vercel Postgres, Railway).
// Defina a variável de ambiente DATABASE_URL com a connection string do seu banco.
// Em produção na Vercel, use a "pooled connection string" (via PgBouncer) do seu provedor.

// Por padrão o driver "pg" converte colunas DATE/TIMESTAMP/TIMESTAMPTZ em
// objetos Date do JavaScript. O projeto inteiro (entidades, formatDate,
// agregações por dia) trata essas colunas como texto — mesmo comportamento
// que o SQLite sempre teve — então desativamos esse parse automático aqui,
// centralizadamente, para todas as conexões do pool.
types.setTypeParser(types.builtins.DATE, (value: string) => value);
types.setTypeParser(types.builtins.TIMESTAMP, (value: string) => value);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value: string) => value);

declare global {
  var __pgPool__: Pool | undefined;
  var __pgReady__: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não definida. Configure a connection string do seu banco Postgres (ex: Neon, Supabase) na variável de ambiente DATABASE_URL."
    );
  }
  const pool = new Pool({
    connectionString,
    max: 5,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });

  // O "dia" usado em CURRENT_DATE, agregações e relatórios (vendas de hoje,
  // faturamento do mês, fluxo diário, etc.) deve virar à meia-noite no
  // horário de Brasília, não no horário do servidor (geralmente UTC). Define
  // o timezone da sessão em cada conexão do pool para que CURRENT_DATE e
  // afins já reflitam o horário local corretamente.
  pool.on("connect", (client) => {
    client.query("SET TIME ZONE 'America/Sao_Paulo'").catch(() => {});
  });

  return pool;
}

export function getPool(): Pool {
  if (!global.__pgPool__) {
    global.__pgPool__ = createPool();
  }
  return global.__pgPool__;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Garante que as tabelas, colunas e dados de exemplo existam antes de qualquer
 * consulta. É chamada automaticamente por `ensureDb()` — não precisa ser
 * invocada diretamente pelos repositórios.
 */
export async function ensureDb(): Promise<void> {
  if (!global.__pgReady__) {
    global.__pgReady__ = (async () => {
      const pool = getPool();
      const client = await pool.connect();
      try {
        await runMigrations(client);
        await seedIfEmpty(client);
        await seedDefaultAdmin(client);
        // A importação dos produtos da ficha é isolada num try/catch próprio:
        // se ela falhar por algum motivo (ex: dado inesperado num dos 1078
        // registros), não pode derrubar o app inteiro — as tabelas essenciais
        // (migrations/seed/admin) já foram garantidas acima.
        try {
          await importFichaProducts(client);
        } catch (err) {
          console.error("Falha ao importar produtos da ficha.pdf (ignorado, app continua funcionando):", err);
        }
      } finally {
        client.release();
      }
    })().catch((err) => {
      // Se algo essencial (migrations/seed/admin) falhar, não deixa a
      // promise rejeitada presa em cache: a próxima requisição tenta de
      // novo, em vez do app ficar quebrado até reiniciar o servidor.
      global.__pgReady__ = undefined;
      throw err;
    });
  }
  return global.__pgReady__;
}

async function runMigrations(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      cnpj TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      document TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      barcode TEXT,
      name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      brand TEXT,
      unit TEXT NOT NULL DEFAULT 'un',
      description TEXT,
      photo_url TEXT,
      purchase_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      sale_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      min_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      location TEXT,
      supplier_id INTEGER REFERENCES suppliers(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      type TEXT NOT NULL CHECK (type IN ('entrada','saida','ajuste')),
      quantity DOUBLE PRECISION NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id),
      client_name TEXT,
      total DOUBLE PRECISION NOT NULL DEFAULT 0,
      profit DOUBLE PRECISION NOT NULL DEFAULT 0,
      payment_method TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
      unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      purchase_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      subtotal DOUBLE PRECISION NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      description TEXT NOT NULL,
      category TEXT,
      amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES clients(id),
      client_name TEXT,
      total DOUBLE PRECISION NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'aberto',
      discount DOUBLE PRECISION NOT NULL DEFAULT 0,
      valid_until TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id SERIAL PRIMARY KEY,
      budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
      unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      subtotal DOUBLE PRECISION NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES suppliers(id),
      supplier_name TEXT,
      total DOUBLE PRECISION NOT NULL DEFAULT 0,
      payment_method TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id SERIAL PRIMARY KEY,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
      unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      subtotal DOUBLE PRECISION NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS client_notes (
      id SERIAL PRIMARY KEY,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id);

    CREATE TABLE IF NOT EXISTS client_note_items (
      id SERIAL PRIMARY KEY,
      note_id INTEGER NOT NULL REFERENCES client_notes(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 1,
      unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
      added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      paid_at TIMESTAMPTZ
    );

    ALTER TABLE client_note_items ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS client_note_payments (
      id SERIAL PRIMARY KEY,
      note_id INTEGER NOT NULL REFERENCES client_notes(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      method TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_client_note_items_note ON client_note_items(note_id);
    CREATE INDEX IF NOT EXISTS idx_client_note_payments_note ON client_note_payments(note_id);

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'funcionario' CHECK (role IN ('admin','gerente','funcionario')),
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Tentativas de login (sucesso e falha), usadas para bloquear login por
    -- e-mail após várias falhas seguidas (proteção contra força bruta).
    CREATE TABLE IF NOT EXISTS login_attempts (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      success BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON login_attempts(email, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    -- "created_at" é a coluna mais consultada do sistema: dashboard ("vendido
    -- hoje"/mês), relatórios e agora paginação/ordenação das listagens. Sem
    -- índice, cada consulta faz sequential scan nas tabelas sales/expenses.
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_client_notes_updated_at ON client_notes(updated_at DESC);

    ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION NOT NULL DEFAULT 0;
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS valid_until TEXT;
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

    -- Excluir um cliente/fornecedor/produto não pode travar por causa do
    -- histórico (vendas, compras, orçamentos e itens já guardam o nome em
    -- texto separadamente). Ajusta as constraints para desvincular (SET NULL)
    -- em vez de bloquear a exclusão. stock_movements não tem nome próprio e
    -- já é removido junto do produto pelo código, então usa CASCADE.
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_supplier_id_fkey;
    ALTER TABLE products ADD CONSTRAINT products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

    ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_supplier_id_fkey;
    ALTER TABLE purchases ADD CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;

    ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_client_id_fkey;
    ALTER TABLE sales ADD CONSTRAINT sales_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

    ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_client_id_fkey;
    ALTER TABLE budgets ADD CONSTRAINT budgets_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

    ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_product_id_fkey;
    ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

    ALTER TABLE sale_items DROP CONSTRAINT IF EXISTS sale_items_product_id_fkey;
    ALTER TABLE sale_items ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

    ALTER TABLE purchase_items DROP CONSTRAINT IF EXISTS purchase_items_product_id_fkey;
    ALTER TABLE purchase_items ADD CONSTRAINT purchase_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

    ALTER TABLE budget_items DROP CONSTRAINT IF EXISTS budget_items_product_id_fkey;
    ALTER TABLE budget_items ADD CONSTRAINT budget_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  `);
}

async function seedDefaultAdmin(client: PoolClient) {
  const { rows } = await client.query("SELECT COUNT(*)::int as count FROM users");
  if (rows[0].count > 0) return;
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync("elson123", salt, 64).toString("hex");
  await client.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
    ["Elson Reis", "elsonreis084@gmail.com", `${salt}:${hash}`, "admin"]
  );
}

async function seedIfEmpty(client: PoolClient) {
  const { rows } = await client.query("SELECT COUNT(*)::int as count FROM categories");
  if (rows[0].count > 0) return;

  const categories = [
    "Cimento", "Tijolos", "Areia", "Pedra", "Ferro", "Tubos", "Hidráulica",
    "Elétrica", "Ferramentas", "Tintas", "Pisos", "Cerâmicas", "Telhas",
    "Madeira", "Parafusos", "Ferragens", "Outros",
  ];
  for (const c of categories) {
    await client.query("INSERT INTO categories (name) VALUES ($1)", [c]);
  }

  const supplierRows: Array<[string, string, string, string, string, string, string, string]> = [
    ["Carlos Mendes", "Cimenteira Norte Distribuidora", "12.345.678/0001-90", "(91) 3222-1100", "(91) 99123-4455", "vendas@cimenteiranorte.com.br", "Belém", "PA"],
    ["Ana Ferragens", "Ferragens Sul Comércio", "23.456.789/0001-11", "(91) 3233-2200", "(91) 98877-1122", "contato@ferragenssul.com.br", "Belém", "PA"],
    ["Roberto Tintas", "Tintas Cores Ltda", "34.567.890/0001-22", "(91) 3244-3300", "(91) 98123-9988", "roberto@tintascores.com.br", "Ananindeua", "PA"],
  ];
  for (const s of supplierRows) {
    await client.query(
      `INSERT INTO suppliers (name, company, cnpj, phone, whatsapp, email, city, state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      s
    );
  }

  const catId = async (name: string): Promise<number> => {
    const { rows } = await client.query("SELECT id FROM categories WHERE name = $1", [name]);
    return rows[0].id;
  };

  const products: Array<[string, string, string, string, string, string, string, number, number, number, number, string, number]> = [
    ["CIM001", "7891234500017", "Cimento CP-II 50kg", "Cimento", "Votoran", "sc", "Cimento de uso geral", 28.5, 34.9, 40, 320, "Galpão A - Corredor 1", 1],
    ["CIM002", "7891234500024", "Argamassa AC-I 20kg", "Cimento", "Quartzolit", "sc", "Argamassa colante para pisos", 14.9, 19.9, 30, 18, "Galpão A - Corredor 1", 1],
    ["FER001", "7891234500031", "Vergalhão CA-50 10mm", "Ferro", "Gerdau", "barra", "Barra de 12 metros", 32.0, 39.9, 30, 210, "Galpão B - Ferro", 2],
    ["FER002", "7891234500048", "Arame Recozido 18", "Ferragens", "Belgo", "kg", "Rolo de arame recozido", 9.5, 13.9, 20, 8, "Galpão B - Ferro", 2],
    ["BLK001", "7891234500055", "Bloco Cerâmico 9 furos", "Tijolos", "Cerâmica Norte", "milheiro", "Bloco estrutural 9x19x19", 650.0, 780.0, 5, 12, "Pátio Externo", 1],
    ["TIN001", "7891234500062", "Tinta Látex Branca 18L", "Tintas", "Coral", "balde", "Tinta látex PVA fosca", 189.0, 249.0, 8, 3, "Galpão A - Tintas", 3],
    ["HID001", "7891234500079", "Tubo PVC Esgoto 100mm", "Hidráulica", "Tigre", "barra", "Barra de 6 metros", 42.0, 55.0, 15, 70, "Galpão C - Hidráulica", 2],
    ["ELE001", "7891234500086", "Fio Elétrico 2,5mm", "Elétrica", "Sil", "rolo", "Rolo com 100 metros", 145.0, 189.9, 10, 2, "Galpão C - Elétrica", 2],
    ["LOU001", "7891234500093", "Vaso Sanitário Convencional", "Cerâmicas", "Deca", "un", "Louça branca padrão", 320.0, 420.0, 4, 1, "Galpão D - Louças", 3],
    ["PAR001", "7891234500109", "Parafuso Autobrocante 4,2x32", "Parafusos", "Cisertec", "cx", "Caixa com 100 unidades", 22.0, 29.9, 15, 40, "Prateleira Parafusos", 2],
  ];

  for (const p of products) {
    const cid = await catId(p[3]);
    await client.query(
      `INSERT INTO products (code, barcode, name, category_id, brand, unit, description, purchase_price, sale_price, min_stock, quantity, location, supplier_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [p[0], p[1], p[2], cid, p[4], p[5], p[6], p[7], p[8], p[9], p[10], p[11], p[12]]
    );
  }

  await client.query(
    `INSERT INTO clients (name, document, phone, city, state) VALUES ($1,$2,$3,$4,$5)`,
    ["José da Silva Construções", "12.345.678/0001-00", "(91) 98888-1234", "Belém", "PA"]
  );
  await client.query(
    `INSERT INTO clients (name, document, phone, city, state) VALUES ($1,$2,$3,$4,$5)`,
    ["Maria Oliveira", "123.456.789-00", "(91) 99999-5566", "Belém", "PA"]
  );
  await client.query(
    `INSERT INTO clients (name, document, phone, city, state) VALUES ($1,$2,$3,$4,$5)`,
    ["Construtora Rio Verde", "45.678.901/0001-22", "(91) 3322-4455", "Ananindeua", "PA"]
  );

  const insertMovement = async (productId: number, type: string, quantity: number, reason: string, daysAgo: number) => {
    await client.query(
      `INSERT INTO stock_movements (product_id, type, quantity, reason, created_at) VALUES ($1,$2,$3,$4, now() - ($5 || ' days')::interval)`,
      [productId, type, quantity, reason, daysAgo]
    );
  };
  await insertMovement(1, "entrada", 100, "Compra inicial", 10);
  await insertMovement(1, "saida", 20, "Venda balcão", 1);
}

// Importa o catálogo de 1078 produtos extraído da ficha de estoque (PDF
// "RELATÓRIO DE PRODUTOS") do sistema anterior do Elson. Usa
// ON CONFLICT (code) DO NOTHING/UPDATE para ser idempotente: roda em todo
// cold start (dentro do mesmo cache de ensureDb), mas só insere produtos
// cujo código ainda não existe — não sobrescreve edições feitas depois pelo
// usuário nem duplica em reinícios. O código de barras é o NCM (código
// fiscal) da ficha, a pedido do Elson — 5 produtos vieram sem NCM na ficha
// original e ficam sem código de barras. Categoria, fornecedor e
// localização não vieram na ficha e ficam em branco (podem ser preenchidos
// manualmente depois). CFOP da ficha não é armazenado pois o catálogo atual
// não modela esse campo.
async function importFichaProducts(client: PoolClient) {
  const products = fichaProducts as Array<{
    code: string;
    name: string;
    unit: string;
    purchasePrice: number;
    salePrice: number;
    minStock: number;
    quantity: number;
    barcode: string | null;
  }>;
  if (products.length === 0) return;

  await client.query(
    `INSERT INTO products (code, name, unit, purchase_price, sale_price, min_stock, quantity, barcode)
     SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::double precision[], $5::double precision[], $6::double precision[], $7::double precision[], $8::text[])
     ON CONFLICT (code) DO UPDATE SET barcode = EXCLUDED.barcode WHERE products.barcode IS NULL`,
    [
      products.map((p) => p.code),
      products.map((p) => p.name),
      products.map((p) => p.unit),
      products.map((p) => p.purchasePrice),
      products.map((p) => p.salePrice),
      products.map((p) => p.minStock),
      products.map((p) => p.quantity),
      products.map((p) => p.barcode),
    ]
  );
}
