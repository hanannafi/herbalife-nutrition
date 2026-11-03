import { Database } from "bun:sqlite";

export const db = new Database("herbalife.sqlite", { create: true });

db.run("PRAGMA foreign_keys = ON");

db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL CHECK(price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    image TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
`);

const result = db.query("SELECT COUNT(*) AS total FROM products").get() as { total: number };

if (result.total === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, category, description, price, stock, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    "Formula 1 Nutritional Shake Mix",
    "Nutritional Shake",
    "Produk shake nutrisi Herbalife. Periksa label kemasan untuk informasi bahan dan penyajian.",
    350000,
    20,
    "🥛"
  );
  insert.run(
    "Protein Drink Mix",
    "Protein",
    "Produk campuran minuman protein. Informasi nutrisi mengikuti label kemasan.",
    275000,
    15,
    "💪"
  );
  insert.run(
    "Herbal Tea Concentrate",
    "Beverage",
    "Konsentrat teh Herbalife. Sajikan sesuai petunjuk pada kemasan.",
    195000,
    12,
    "🍵"
  );
  insert.run(
    "Personalized Protein Powder",
    "Protein",
    "Bubuk protein untuk melengkapi pilihan nutrisi harian. Periksa label produk.",
    310000,
    10,
    "🌿"
  );
}
