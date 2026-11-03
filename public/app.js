const API = "/api";

const rupiah = (amount) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(amount);

const productImages = {
  "Formula 1 Nutritional Shake Mix": "/images/formula-1-shake.svg",
  "Protein Drink Mix": "/images/protein-drink.svg",
  "Herbal Tea Concentrate": "/images/herbal-tea.svg",
  "Personalized Protein Powder": "/images/protein-powder.svg"
};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

async function loadProducts(search = "") {
  const productList = document.querySelector("#product-list");
  const productSelect = document.querySelector("#product-select");

  try {
    const response = await fetch(`${API}/products?search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error("Gagal mengambil produk");
    const products = await response.json();

    if (products.length === 0) {
      productList.innerHTML = "<p>Produk tidak ditemukan.</p>";
      productSelect.innerHTML = "";
      return;
    }

    productList.innerHTML = products.map((product) => `
      <article class="product-card">
        <div class="product-image">
          ${productImages[product.name]
            ? `<img src="${productImages[product.name]}" alt="${escapeHTML(product.name)}" loading="lazy">`
            : `<span aria-hidden="true">${escapeHTML(product.image || "🌿")}</span>`}
        </div>
        <h3>${escapeHTML(product.name)}</h3>
        <div class="product-bottom">
          <div class="price">${rupiah(product.price)}</div>
          <button class="choose" data-product-id="${product.id}">Pilih</button>
        </div>
      </article>
    `).join("");

    productSelect.innerHTML = products.map((product) => `
      <option value="${product.id}">${escapeHTML(product.name)} — ${rupiah(product.price)}</option>
    `).join("");

    document.querySelectorAll(".choose").forEach((button) => {
      button.addEventListener("click", () => {
        productSelect.value = button.dataset.productId;
        document.querySelector("#order-form").scrollIntoView({ behavior: "smooth" });
      });
    });
  } catch (error) {
    productList.textContent = "Tidak dapat memuat produk. Pastikan server aktif.";
    console.error(error);
  }
}

async function loadOrders() {
  const orderList = document.querySelector("#order-list");
  const orderMessage = document.querySelector("#order-message");
  try {
    const response = await fetch(`${API}/orders`);
    if (!response.ok) throw new Error("Gagal mengambil riwayat pesanan");
    const result = await response.json();
    const orders = result.data || [];

    orderList.innerHTML = orders.length ? orders.map((order) => `
      <div class="order-row">
        <span><b>${escapeHTML(order.customer_name)}</b><br>
        ${escapeHTML(order.product_name)} × ${order.quantity}</span>
        <div class="order-actions">
          <b>${rupiah(order.total_price)}</b>
          <button class="order-delete" type="button" data-order-id="${order.id}" aria-label="Hapus pesanan ${order.id}">Hapus</button>
        </div>
      </div>
    `).join("") : "Belum ada pesanan.";
  } catch (error) {
    orderList.textContent = "Gagal memuat riwayat pesanan.";
    orderMessage.textContent = error.message;
    console.error(error);
  }
}

document.querySelector("#order-list").addEventListener("click", async (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest(".order-delete");
  if (!(button instanceof HTMLButtonElement)) return;

  const orderId = button.dataset.orderId;
  if (!orderId || !window.confirm("Hapus pesanan ini dari riwayat? Stok tidak akan berubah.")) return;

  const orderMessage = document.querySelector("#order-message");
  button.disabled = true;
  orderMessage.textContent = "";

  try {
    const response = await fetch(`${API}/orders/${encodeURIComponent(orderId)}`, {
      method: "DELETE"
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Pesanan gagal dihapus");

    orderMessage.textContent = result.message;
    await loadOrders();
  } catch (error) {
    orderMessage.textContent = error.message;
    button.disabled = false;
    console.error(error);
  }
});

document.querySelector("#order-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = new FormData(event.currentTarget);
  const payload = {
    customer_name: form.get("customer_name"),
    customer_phone: form.get("customer_phone"),
    product_id: Number(form.get("product_id")),
    quantity: Number(form.get("quantity"))
  };

  const message = document.querySelector("#message");
  message.textContent = "Mengirim pesanan...";

  try {
    const response = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Pesanan gagal");

    message.textContent = `${result.message}. Total: ${rupiah(result.data.total)}`;
    event.currentTarget.reset();
    await loadProducts(document.querySelector("#search").value);
    await loadOrders();
  } catch (error) {
    message.textContent = error.message;
  }
});

document.querySelector("#search").addEventListener("input", (event) => {
  loadProducts(event.target.value);
});

loadProducts();
loadOrders();
