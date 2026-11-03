import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { db } from "./database";

type Product = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  image: string;
};

const app = new Elysia()
  .use(staticPlugin({ assets: "public", prefix: "/" }))

  // Cek apakah API aktif
  .get("/api/health", () => ({
    success: true,
    message: "Herbalife Nutrition API aktif"
  }))

  // READ: semua produk
  .get("/api/products", ({ query }) => {
    const search = typeof query.search === "string" ? query.search.trim() : "";
    if (search) {
      return db.query(`
        SELECT * FROM products
        WHERE name LIKE ? OR category LIKE ?
        ORDER BY id DESC
      `).all(`%${search}%`, `%${search}%`);
    }
    return db.query("SELECT * FROM products ORDER BY id DESC").all();
  })

  // READ: detail satu produk
  .get("/api/products/:id", ({ params, set }) => {
    const product = db.query("SELECT * FROM products WHERE id = ?")
      .get(Number(params.id)) as Product | null;

    if (!product) {
      set.status = 404;
      return { success: false, message: "Produk tidak ditemukan" };
    }
    return { success: true, data: product };
  })

  // CREATE: tambah produk
  .post("/api/products", ({ body, set }) => {
    const result = db.query(`
      INSERT INTO products (name, category, description, price, stock, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      body.name,
      body.category,
      body.description,
      body.price,
      body.stock,
body.image ?? ""
    );

    set.status = 201;
    return {
      success: true,
      message: "Produk berhasil ditambahkan",
      id: Number(result.lastInsertRowid)
    };
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      category: t.String({ minLength: 2 }),
      description: t.String(),
      price: t.Number({ minimum: 0 }),
      stock: t.Number({ minimum: 0 }),
      image: t.Optional(t.String())
    })
  })

  // UPDATE: ubah seluruh data produk
  .put("/api/products/:id", ({ params, body, set }) => {
    const result = db.query(`
      UPDATE products
      SET name = ?, category = ?, description = ?, price = ?, stock = ?, image = ?
      WHERE id = ?
    `).run(
      body.name,
      body.category,
      body.description,
      body.price,
      body.stock,
      body.image,
      Number(params.id)
    );

    if (result.changes === 0) {
      set.status = 404;
      return { success: false, message: "Produk tidak ditemukan" };
    }
    return { success: true, message: "Produk berhasil diperbarui" };
  }, {
    body: t.Object({
      name: t.String({ minLength: 2 }),
      category: t.String({ minLength: 2 }),
      description: t.String(),
      price: t.Number({ minimum: 0 }),
      stock: t.Number({ minimum: 0 }),
      image: t.String()
    })
  })

  // PATCH: ubah stok saja
  .patch("/api/products/:id/stock", ({ params, body, set }) => {
    const result = db.query("UPDATE products SET stock = ? WHERE id = ?")
      .run(body.stock, Number(params.id));

    if (result.changes === 0) {
      set.status = 404;
      return { success: false, message: "Produk tidak ditemukan" };
    }
    return { success: true, message: "Stok berhasil diperbarui" };
  }, {
    body: t.Object({ stock: t.Number({ minimum: 0 }) })
  })

  // DELETE: hapus produk
  .delete("/api/products/:id", ({ params, set }) => {
    try {
      const result = db.query("DELETE FROM products WHERE id = ?")
        .run(Number(params.id));

      if (result.changes === 0) {
        set.status = 404;
        return { success: false, message: "Produk tidak ditemukan" };
      }
      return { success: true, message: "Produk berhasil dihapus" };
    } catch {
      set.status = 409;
      return {
        success: false,
        message: "Produk tidak dapat dihapus karena sudah tercatat dalam pesanan"
      };
    }
  })

  // CREATE: buat pesanan dan kurangi stok secara atomik
  .post("/api/orders", ({ body, set }) => {
    const createOrder = db.transaction(() => {
      const product = db.query("SELECT * FROM products WHERE id = ?")
        .get(body.product_id) as Product | null;

      if (!product) return { error: "Produk tidak ditemukan", status: 404 as const };
      if (product.stock < body.quantity) {
        return { error: "Stok produk tidak mencukupi", status: 400 as const };
      }

      const total = product.price * body.quantity;
      const inserted = db.query(`
        INSERT INTO orders
          (customer_name, customer_phone, product_id, product_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        body.customer_name,
        body.customer_phone,
        product.id,
        product.name,
        body.quantity,
        product.price,
        total
      );

      db.query("UPDATE products SET stock = stock - ? WHERE id = ?")
        .run(body.quantity, product.id);

      return {
        order_id: Number(inserted.lastInsertRowid),
        product_name: product.name,
        quantity: body.quantity,
        total
      };
    });

    const result = createOrder();
    if ("error" in result) {
      set.status = result.status;
      return { success: false, message: result.error };
    }

    set.status = 201;
    return {
      success: true,
      message: "Pesanan berhasil dibuat",
      data: result
    };
  }, {
    body: t.Object({
      customer_name: t.String({ minLength: 2 }),
      customer_phone: t.String({ minLength: 8 }),
      product_id: t.Number(),
      quantity: t.Number({ minimum: 1 })
    })
  })

  // READ: daftar pesanan
  .get("/api/orders", () => ({
    success: true,
    data: db.query("SELECT * FROM orders ORDER BY id DESC").all()
  }))

  // DELETE: hapus pesanan dari riwayat tanpa mengubah stok
  .delete("/api/orders/:id", ({ params, set }) => {
    const result = db.query("DELETE FROM orders WHERE id = ?")
      .run(Number(params.id));

    if (result.changes === 0) {
      set.status = 404;
      return { success: false, message: "Pesanan tidak ditemukan" };
    }

    return { success: true, message: "Pesanan dihapus dari riwayat" };
  })

  .listen(3000);

console.log(`Server berjalan di http://localhost:${app.server?.port}`);
console.log(`API tersedia di http://localhost:${app.server?.port}/api/products`);
