// Copia os dados reais do banco SQLite local (data/ferragens.db) para o banco
// PostgreSQL configurado em DATABASE_URL (ex: Neon, Supabase).
//
// Como rodar (na raiz do projeto, no seu computador):
//   npm install
//   node --env-file=.env.local scripts/migrate-to-postgres.js
//
// É seguro rodar mais de uma vez: cada tabela só é copiada se estiver vazia
// no Postgres (não duplica dados).

const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { Pool } = require("pg");

const SQLITE_PATH = path.join(__dirname, "..", "data", "ferragens.db");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL não definida. Rode com: node --env-file=.env.local scripts/migrate-to-postgres.js");
    process.exit(1);
  }

  const sqlite = new DatabaseSync(SQLITE_PATH);
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    console.log("Criando tabelas no Postgres (se ainda não existirem)...");
    await runMigrations(client);

    await copyTable(sqlite, client, {
      sqliteTable: "categories",
      pgTable: "categories",
      columns: ["id", "name"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "suppliers",
      pgTable: "suppliers",
      columns: ["id", "name", "company", "cnpj", "phone", "whatsapp", "email", "address", "city", "state", "notes", "created_at"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "clients",
      pgTable: "clients",
      columns: ["id", "name", "document", "phone", "whatsapp", "email", "address", "city", "state", "notes", "created_at"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "products",
      pgTable: "products",
      columns: [
        "id", "code", "barcode", "name", "category_id", "brand", "unit", "description", "photo_url",
        "purchase_price", "sale_price", "min_stock", "quantity", "location", "supplier_id", "created_at", "updated_at",
      ],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "stock_movements",
      pgTable: "stock_movements",
      columns: ["id", "product_id", "type", "quantity", "reason", "created_at"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "purchases",
      pgTable: "purchases",
      columns: ["id", "supplier_id", "supplier_name", "total", "payment_method", "notes", "created_at"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "purchase_items",
      pgTable: "purchase_items",
      columns: ["id", "purchase_id", "product_id", "product_name", "quantity", "unit_price", "subtotal"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "sales",
      pgTable: "sales",
      columns: ["id", "client_id", "client_name", "total", "profit", "payment_method", "created_at"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "sale_items",
      pgTable: "sale_items",
      columns: ["id", "sale_id", "product_id", "product_name", "quantity", "unit_price", "purchase_price", "subtotal"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "budgets",
      pgTable: "budgets",
      columns: ["id", "client_id", "client_name", "total", "status", "discount", "valid_until", "notes", "created_at"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "budget_items",
      pgTable: "budget_items",
      columns: ["id", "budget_id", "product_id", "product_name", "quantity", "unit_price", "subtotal"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "expenses",
      pgTable: "expenses",
      columns: ["id", "description", "category", "amount", "created_at"],
    });

    await copyTable(sqlite, client, {
      sqliteTable: "users",
      pgTable: "users",
      columns: ["id", "name", "email", "password_hash", "role", "active", "created_at"],
      booleanColumns: ["active"],
    });

    console.log("\nMigração concluída com sucesso.");
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

async function copyTable(sqlite, client, { sqliteTable, pgTable, columns, booleanColumns = [] }) {
  const { rows: existing } = await client.query(`SELECT COUNT(*)::int as c FROM ${pgTable}`);
  if (existing[0].c > 0) {
    console.log(`- ${pgTable}: já tem dados no Postgres, pulando.`);
    return;
  }

  const rows = sqlite.prepare(`SELECT ${columns.join(", ")} FROM ${sqliteTable}`).all();
  if (rows.length === 0) {
    console.log(`- ${pgTable}: nenhum registro para copiar.`);
    return;
  }

  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const insertSql = `INSERT INTO ${pgTable} (${columns.join(", ")}) VALUES (${placeholders})`;

  for (const row of rows) {
    const values = columns.map((col) => {
      const v = row[col];
      if (booleanColumns.includes(col)) return Boolean(v);
      return v ?? null;
    });
    await client.query(insertSql, values);
  }

  if (columns.includes("id")) {
    await client.query(
      `SELECT setval(pg_get_serial_sequence('${pgTable}', 'id'), COALESCE((SELECT MAX(id) FROM ${pgTable}), 1))`
    );
  }

  console.log(`- ${pgTable}: ${rows.length} registro(s) copiado(s).`);
}

async function runMigrations(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, company TEXT, cnpj TEXT, phone TEXT,
      whatsapp TEXT, email TEXT, address TEXT, city TEXT, state TEXT, notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, document TEXT, phone TEXT, whatsapp TEXT,
      email TEXT, address TEXT, city TEXT, state TEXT, notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY, code TEXT NOT NULL UNIQUE, barcode TEXT, name TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id), brand TEXT, unit TEXT NOT NULL DEFAULT 'un',
      description TEXT, photo_url TEXT, purchase_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      sale_price DOUBLE PRECISION NOT NULL DEFAULT 0, min_stock DOUBLE PRECISION NOT NULL DEFAULT 0,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 0, location TEXT, supplier_id INTEGER REFERENCES suppliers(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS stock_movements (
      id SERIAL PRIMARY KEY, product_id INTEGER NOT NULL REFERENCES products(id),
      type TEXT NOT NULL CHECK (type IN ('entrada','saida','ajuste')), quantity DOUBLE PRECISION NOT NULL,
      reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sales (
      id SERIAL PRIMARY KEY, client_id INTEGER REFERENCES clients(id), client_name TEXT,
      total DOUBLE PRECISION NOT NULL DEFAULT 0, profit DOUBLE PRECISION NOT NULL DEFAULT 0,
      payment_method TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY, sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id), product_name TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 1, unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      purchase_price DOUBLE PRECISION NOT NULL DEFAULT 0, subtotal DOUBLE PRECISION NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY, description TEXT NOT NULL, category TEXT,
      amount DOUBLE PRECISION NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY, client_id INTEGER REFERENCES clients(id), client_name TEXT,
      total DOUBLE PRECISION NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'aberto',
      discount DOUBLE PRECISION NOT NULL DEFAULT 0, valid_until TEXT, notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS budget_items (
      id SERIAL PRIMARY KEY, budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id), product_name TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 1, unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      subtotal DOUBLE PRECISION NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY, supplier_id INTEGER REFERENCES suppliers(id), supplier_name TEXT,
      total DOUBLE PRECISION NOT NULL DEFAULT 0, payment_method TEXT, notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS purchase_items (
      id SERIAL PRIMARY KEY, purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id), product_name TEXT NOT NULL,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 1, unit_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      subtotal DOUBLE PRECISION NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'funcionario' CHECK (role IN ('admin','gerente','funcionario')),
      active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION NOT NULL DEFAULT 0;
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS valid_until TEXT;
    ALTER TABLE budgets ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
  `);
}

main().catch((err) => {
  console.error("Erro na migração:", err);
  process.exit(1);
});
