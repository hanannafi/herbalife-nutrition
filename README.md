# Herbalife Nutrition Store — RESTful API & Frontend

Proyek pembelajaran full-stack dengan Elysia, TypeScript, Bun, SQLite, HTML, CSS, dan JavaScript.

**Catatan:** Ini prototipe independen untuk pembelajaran, bukan website resmi atau afiliasi Herbalife. Nama produk digunakan sebagai contoh katalog. Harga, stok, deskripsi, dan emoji adalah data demo, bukan informasi resmi atau klaim medis. Perbarui data berdasarkan kemasan/katalog resmi dan izin penjualan yang berlaku.

## Menjalankan proyek

1. Install Bun: https://bun.sh
2. Buka folder proyek di VS Code.
3. Jalankan di terminal:

```powershell
bun install
bun run dev
```

4. Buka http://localhost:3000

Database `herbalife.sqlite` dan data produk contoh dibuat otomatis saat server pertama kali dijalankan.

## Endpoint API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Cek server |
| GET | `/api/products` | Daftar produk |
| GET | `/api/products?search=shake` | Cari produk |
| GET | `/api/products/:id` | Detail produk |
| POST | `/api/products` | Tambah produk |
| PUT | `/api/products/:id` | Ubah semua data produk |
| PATCH | `/api/products/:id/stock` | Ubah stok |
| DELETE | `/api/products/:id` | Hapus produk |
| POST | `/api/orders` | Buat pesanan |
| GET | `/api/orders` | Riwayat pesanan |
| DELETE | `/api/orders/:id` | Hapus pesanan dari riwayat tanpa mengubah stok |

## Uji dengan Postman

Base URL: `http://localhost:3000`

### 1. GET produk
`GET http://localhost:3000/api/products`

### 2. GET detail produk
`GET http://localhost:3000/api/products/1`

### 3. POST tambah produk
`POST http://localhost:3000/api/products`

Pilih Body → raw → JSON:

```json
{
  "name": "Demo Shake Baru",
  "category": "Nutritional Shake",
  "description": "Produk contoh untuk pengujian.",
  "price": 200000,
  "stock": 10,
  "image": "🥛"
}
```

### 4. PUT ubah produk
`PUT http://localhost:3000/api/products/1`

```json
{
  "name": "Formula 1 Shake Demo",
  "category": "Nutritional Shake",
  "description": "Deskripsi yang diperbarui untuk pengujian.",
  "price": 355000,
  "stock": 22,
  "image": "🥛"
}
```

### 5. PATCH ubah stok
`PATCH http://localhost:3000/api/products/1/stock`

```json
{
  "stock": 30
}
```

### 6. DELETE produk
`DELETE http://localhost:3000/api/products/4`

### 7. POST buat pesanan
`POST http://localhost:3000/api/orders`

```json
{
  "customer_name": "Hanan",
  "customer_phone": "081234567890",
  "product_id": 1,
  "quantity": 2
}
```

### 8. GET riwayat pesanan
`GET http://localhost:3000/api/orders`

## Struktur folder

```text
herbalife-nutrition/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── src/
│   ├── database.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Cara integrasi frontend

Frontend memakai `fetch()` untuk mengakses endpoint backend. Contohnya:

```javascript
const response = await fetch("/api/products");
const products = await response.json();
```

Saat pelanggan checkout, JavaScript mengirim `POST /api/orders` dengan JSON. Backend memvalidasi data, menyimpan pesanan, dan mengurangi stok di SQLite.

## Batasan prototipe

Versi ini belum memiliki login, role admin, gateway pembayaran, pengiriman, atau deployment online. Jangan gunakan untuk transaksi pelanggan sungguhan sebelum menambahkan autentikasi, otorisasi, keamanan, validasi, dan kebijakan privasi.
