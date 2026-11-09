function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function createProdukCard(produk) {
  const card = document.createElement("article");
  card.className = "content-card product-card";

  const category = document.createElement("span");
  category.className = "tag";
  category.textContent = produk.kategori;

  const title = document.createElement("h2");
  title.textContent = produk.nama;

  const description = document.createElement("p");
  description.textContent = produk.deskripsi;

  const price = document.createElement("strong");
  price.className = "product-price";
  price.textContent = formatRupiah(produk.harga);

  const actions = document.createElement("div");
  actions.className = "product-actions";

  const edit = document.createElement("a");
  edit.className = "btn btn-outline-custom btn-small";
  edit.href = `/produk/${produk.id}/edit`;
  edit.textContent = "Edit";

  const remove = document.createElement("button");
  remove.className = "btn btn-danger-outline btn-small";
  remove.type = "button";
  remove.dataset.deleteId = produk.id;
  remove.textContent = "Hapus";

  actions.append(edit, remove);
  card.append(category, title, description, price, actions);
  return card;
}

const productList = document.querySelector("#produk-list");
const productStatus = document.querySelector("#produk-status");
const productError = document.querySelector("#produk-error");

async function loadProduk() {
  if (!productList) return;

  productList.setAttribute("aria-busy", "true");
  productList.replaceChildren();
  if (productError) productError.hidden = true;
  if (productStatus) productStatus.textContent = "Memuat data dari database...";

  try {
    const response = await fetch("/api/produk");
    if (!response.ok) throw new Error("Gagal mengambil data produk dari server.");

    const products = await response.json();
    if (!Array.isArray(products)) throw new Error("Format data produk tidak sesuai.");

    if (products.length === 0) {
      productStatus.textContent = "Belum ada data produk. Silakan tambahkan produk pertama.";
      return;
    }

    const fragment = document.createDocumentFragment();
    products.forEach((produk) => fragment.append(createProdukCard(produk)));
    productList.append(fragment);
    productStatus.textContent = `${products.length} produk berhasil dimuat dari database.`;
  } catch (error) {
    productStatus.textContent = "Data produk belum dapat ditampilkan.";
    if (productError) {
      productError.textContent = error.message;
      productError.hidden = false;
    }
  } finally {
    productList.setAttribute("aria-busy", "false");
  }
}

if (productList) {
  productList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-delete-id]");
    if (!button) return;

    const id = button.dataset.deleteId;
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;

    button.disabled = true;
    button.textContent = "Menghapus...";

    try {
      const response = await fetch(`/api/produk/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.pesan || "Produk gagal dihapus.");
      await loadProduk();
    } catch (error) {
      window.alert(error.message);
      button.disabled = false;
      button.textContent = "Hapus";
    }
  });

  loadProduk();
}

const productForm = document.querySelector("#produk-form");
if (productForm) {
  const mode = productForm.dataset.mode;
  const id = productForm.dataset.id;
  const status = document.querySelector("#form-status");
  const submitButton = document.querySelector("#submit-button");

  const fields = {
    nama: productForm.elements.nama,
    kategori: productForm.elements.kategori,
    harga: productForm.elements.harga,
    deskripsi: productForm.elements.deskripsi
  };

  async function loadForEdit() {
    status.textContent = "Mengambil data produk...";
    try {
      const response = await fetch(`/api/produk/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.pesan || "Produk tidak ditemukan.");

      fields.nama.value = result.data.nama;
      fields.kategori.value = result.data.kategori;
      fields.harga.value = result.data.harga;
      fields.deskripsi.value = result.data.deskripsi;
      status.textContent = "";
    } catch (error) {
      status.textContent = error.message;
      submitButton.disabled = true;
    }
  }

  productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!productForm.reportValidity()) return;

    const payload = {
      nama: fields.nama.value.trim(),
      kategori: fields.kategori.value.trim(),
      harga: fields.harga.value,
      deskripsi: fields.deskripsi.value.trim()
    };

    const url = mode === "edit" ? `/api/produk/${id}` : "/api/produk";
    const method = mode === "edit" ? "PUT" : "POST";

    submitButton.disabled = true;
    status.textContent = "Menyimpan data...";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        const validationMessage = result.errors
          ? Object.values(result.errors).join(" ")
          : result.pesan;
        throw new Error(validationMessage || "Data gagal disimpan.");
      }

      window.location.href = `/produk?pesan=${encodeURIComponent(result.pesan)}`;
    } catch (error) {
      status.textContent = error.message;
      submitButton.disabled = false;
    }
  });

  if (mode === "edit") loadForEdit();
}
