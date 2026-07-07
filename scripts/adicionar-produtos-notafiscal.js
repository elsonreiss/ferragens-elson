// Cadastra os 19 produtos recebidos na nota fiscal (colada pelo usuário no
// chat) direto no banco Postgres, com preço de venda calculado com margem
// de 40% sobre o preço de compra. Também registra a entrada em estoque.
//
// Como rodar (na raiz do projeto, no seu computador):
//   node --env-file=.env.local scripts/adicionar-produtos-notafiscal.js
//
// É seguro rodar mais de uma vez: produtos cujo código já existe no banco
// são pulados (não duplica).

const { Pool } = require("pg");

const MARGEM_VENDA = 0.40; // 40% — mesma margem usada na planilha

// [código, nome, categoria, marca, unidade, qtd recebida, preço de compra, estoque mínimo]
const PRODUTOS = [
  ["33391", "Broca Aço Rápido 3mm Cartela", "Ferramentas", "Tramontina", "un", 10, 3.30, 2],
  ["33395", "Broca Aço Rápido 5mm Cartela", "Ferramentas", "Tramontina", "un", 10, 4.44, 2],
  ["18510", "Cantoneira Francesa 19x12cm Branca", "Ferragens", "Fertak", "un", 12, 2.66, 2],
  ["19765", "Cantoneira Francesa 23cm Branca", "Ferragens", "Fertak", "un", 12, 3.50, 2],
  ["19766", "Cantoneira Francesa 29cm Branca", "Ferragens", "Fertak", "un", 12, 4.11, 2],
  ["18515", "Cantoneira Francesa 38,5cm Branca", "Ferragens", "Fertak", "un", 12, 9.00, 2],
  ["22363", "Cantoneira Francesa 48,5cm Branca", "Ferragens", "Fertak", "un", 12, 11.90, 2],
  ["23230", "Interruptor 1 Tecla 6A + Tomada 2P+T 10A Aria", "Elétrica", "Tramontina", "un", 20, 8.64, 4],
  ["23231", "Interruptor 1 Tecla 6A + Tomada 2P+T 20A Aria", "Elétrica", "Tramontina", "un", 20, 8.93, 4],
  ["11134", "Jogo Chave Allen 1,5 a 10mm (10 peças)", "Ferramentas", "Brasfort", "cj", 5, 9.80, 2],
  ["54584", "Nível de Alumínio Magnético 9\"", "Ferramentas", "Amaforte", "un", 4, 9.00, 2],
  ["50195", "Prego Telheiro p/ Ondulina (pacote 30un)", "Ferragens", "Amaforte", "pct", 20, 7.52, 4],
  ["48475", "Sanduicheira Grill 127V 750W Preta", "Outros", "Kian", "un", 1, 61.00, 1],
  ["64551", "Serra Widia p/ Máquina 24 Dentes 110mm", "Ferramentas", "Amaforte", "un", 10, 6.00, 2],
  ["26562", "Tela Plástica Pinto 1,50x50m", "Outros", "Tutti", "rl", 1, 314.12, 1],
  ["23236", "Tomada 2P+T 10A Branca Aria", "Elétrica", "Tramontina", "un", 20, 5.65, 4],
  ["29237", "Tomada 2P+T 20A Branca Aria", "Elétrica", "Tramontina", "un", 20, 5.65, 4],
  ["21255", "Trena Emborrachada 5m x 18mm", "Ferramentas", "Fertak", "un", 6, 8.30, 2],
  ["16171", "Trincha 2.1/2\"", "Tintas", "Roma", "un", 12, 4.38, 2],
];

async function getOrCreateCategoryId(client, name) {
  const found = await client.query("SELECT id FROM categories WHERE name = $1", [name]);
  if (found.rows.length > 0) return found.rows[0].id;
  const created = await client.query("INSERT INTO categories (name) VALUES ($1) RETURNING id", [name]);
  return created.rows[0].id;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL não definida. Rode com: node --env-file=.env.local scripts/adicionar-produtos-notafiscal.js");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  let criados = 0;
  let pulados = 0;

  try {
    for (const [code, name, categoryName, brand, unit, qty, purchasePrice, minStock] of PRODUTOS) {
      const existing = await client.query("SELECT id FROM products WHERE code = $1", [code]);
      if (existing.rows.length > 0) {
        console.log(`- [pulado] ${code} — ${name} (já existe no banco)`);
        pulados++;
        continue;
      }

      const categoryId = await getOrCreateCategoryId(client, categoryName);
      const salePrice = Math.round((purchasePrice / (1 - MARGEM_VENDA)) * 100) / 100;

      const inserted = await client.query(
        `INSERT INTO products (code, name, category_id, brand, unit, purchase_price, sale_price, min_stock, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [code, name, categoryId, brand, unit, purchasePrice, salePrice, minStock, qty]
      );
      const productId = inserted.rows[0].id;

      await client.query(
        `INSERT INTO stock_movements (product_id, type, quantity, reason) VALUES ($1, 'entrada', $2, $3)`,
        [productId, qty, "Entrada de nota fiscal - cadastro inicial"]
      );

      console.log(`+ [criado] ${code} — ${name} | ${qty} ${unit} | compra R$ ${purchasePrice.toFixed(2)} | venda R$ ${salePrice.toFixed(2)}`);
      criados++;
    }

    console.log(`\nConcluído: ${criados} produto(s) cadastrado(s), ${pulados} já existiam e foram pulados.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
