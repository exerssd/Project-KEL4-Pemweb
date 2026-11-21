/* ==========================================================
   modal.js — popup top up (pilih nominal, username, pembayaran)
   Checkout uses the existing order API for database products.
   ========================================================== */

let currentPackages = ROBUX_PACKAGES;
let currentProducts = null;
let selectedPackage = null;
let selectedProduct = null;
let selectedPayment = null;
let productsPromise = null;
let modalRequestId = 0;
const hiddenOrderKey = (orderNumber) =>
  `alifstore.hidden-cancelled-order.${encodeURIComponent(orderNumber)}`;

function getStoreProducts() {
  if (!productsPromise) {
    productsPromise = fetch("../backend/api/Products.php", { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Produk tidak dapat dimuat.");
        if (!Array.isArray(data.products)) throw new Error("Format data produk tidak valid.");
        return data.products;
      })
      .catch((error) => {
        productsPromise = null;
        throw error;
      });
  }
  return productsPromise;
}

function renderStoreProducts(products) {
  const container = $("#po");
  container.replaceChildren();

  if (products.length === 0) {
    container.textContent = "Belum ada produk yang tersedia.";
    return;
  }

  products.forEach((product) => {
    const button = document.createElement("button");
    button.className = "opt";
    button.type = "button";
    button.dataset.productId = product.id;
    button.textContent = product.name;

    const price = document.createElement("small");
    price.textContent = formatRupiah(Number(product.price));
    button.append(price);
    container.append(button);
  });
}

// Update total bayar & status tombol "Bayar Sekarang"
function updateSummary() {
  const price = selectedProduct
    ? Number(selectedProduct.price)
    : selectedPackage == null
      ? null
      : currentPackages[selectedPackage][1];
  $("#tt").textContent = price == null ? "Rp0" : formatRupiah(price);

  const usernameValid = $("#un").value.trim().length >= 3;
  const productSelected = selectedProduct !== null || selectedPackage !== null;
  $("#go").disabled = !(productSelected && selectedPayment && usernameValid);
}

function closeModal() {
  modalRequestId++;
  $("#ov").classList.remove("on");
}

// key: "p0" = produk index 0, "g3" = game index 3
async function openModal(key) {
  const isGame = key[0] === "g";
  const index = +key.slice(1);
  const name = (isGame ? GAMES[index] : PRODUCTS[index])[0];
  const useStoreProducts = !isGame && ROBUX_PRODUCT_INDEXES.includes(index);
  const requestId = ++modalRequestId;

  currentProducts = useStoreProducts ? [] : null;
  currentPackages = useStoreProducts
    ? []
    : isGame || !ROBUX_PRODUCT_INDEXES.includes(index)
      ? ITEM_PACKAGES
      : ROBUX_PACKAGES;
  selectedPackage = null;
  selectedProduct = null;
  selectedPayment = null;

  $("#mt").textContent = "Top Up " + name;
  $("#ms").textContent = isGame
    ? "Item dan mata uang in-game · proses instan"
    : "Pilih nominal, isi username, selesai dalam hitungan menit";

  if (useStoreProducts) {
    $("#po").textContent = "Memuat produk...";
  } else {
    $("#po").innerHTML = currentPackages
      .map(([label, price], j) => `<button class="opt" type="button" data-p="${j}">${label}<small>${formatRupiah(price)}</small></button>`)
      .join("");
  }
  $("#pm").innerHTML = PAYMENTS.map((p) => `<button class="opt" data-m="${p}">${p}</button>`).join("");

  $("#un").value = "";
  $("#fm").hidden = false;
  $("#ok").hidden = true;
  $("#ov").classList.add("on");
  updateSummary();

  if (useStoreProducts) {
    try {
      const products = await getStoreProducts();
      if (requestId !== modalRequestId) return;
      currentProducts = products;
      renderStoreProducts(products);
    } catch (error) {
      if (requestId !== modalRequestId) return;
      $("#po").textContent = error.message;
    }
    updateSummary();
  }
}

async function submitOrder() {
  const message = $("#order-message");
  message.textContent = "";

  if (!currentUser) {
    message.textContent = "Silakan masuk terlebih dahulu untuk membuat pesanan.";
    openAuthModal();
    return;
  }
  if (!selectedProduct) {
    message.textContent = "Produk ini belum tersedia di database.";
    return;
  }

  const submitButton = $("#go");
  submitButton.disabled = true;
  submitButton.textContent = "Memproses...";

  try {
    const response = await fetch("../backend/api/order-create.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: selectedProduct.id,
        quantity: 1,
        game_username: $("#un").value.trim(),
        payment_method: selectedPayment,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Pesanan gagal dibuat.");

    $("#fm").hidden = true;
    $("#ok").hidden = false;
    $("#oi").textContent =
      `Nomor pesanan: ${data.order_number} · Status: ${data.status} · Total: ${formatRupiah(Number(data.total))}.`;
  } catch (error) {
    message.textContent = error.message;
    submitButton.disabled = false;
  } finally {
    submitButton.textContent = "Bayar Sekarang";
  }
}

function renderCustomerOrders(orders) {
  const list = $("#customer-orders-list");
  list.replaceChildren();

  const visibleOrders = orders.filter(
    (order) => order.status !== "cancelled" || localStorage.getItem(hiddenOrderKey(order.order_number)) !== "1"
  );

  if (visibleOrders.length === 0) {
    $("#orders-message").textContent = orders.length
      ? "Tidak ada riwayat pesanan yang ditampilkan."
      : "Kamu belum memiliki pesanan.";
    return;
  }

  $("#orders-message").textContent = "";
  visibleOrders.forEach((order) => {
    const item = document.createElement("article");
    item.className = "customer-order";

    const heading = document.createElement("div");
    heading.className = "customer-order-head";
    const number = document.createElement("span");
    number.textContent = order.order_number;
    const status = document.createElement("span");
    status.textContent = order.status;
    heading.append(number, status);

    const details = document.createElement("p");
    details.className = "customer-order-details";
    details.textContent =
      `${order.product_name} × ${order.quantity} · ${formatRupiah(Number(order.total))} · ` +
      `${order.payment_method} · Username: ${order.game_username} · ${order.created_at}`;

    item.append(heading, details);
    if (order.status === "cancelled") {
      const deleteButton = document.createElement("button");
      deleteButton.className = "customer-order-delete";
      deleteButton.type = "button";
      deleteButton.dataset.orderHistoryHide = order.order_number;
      deleteButton.textContent = "Hapus riwayat";
      item.append(deleteButton);
    }
    list.append(item);
  });
}

async function openCustomerOrders() {
  if (!currentUser) {
    openAuthModal();
    return;
  }

  $("#orders-modal").classList.add("on");
  $("#orders-message").textContent = "Memuat pesanan...";
  $("#customer-orders-list").replaceChildren();

  try {
    const response = await fetch("../backend/api/order-status.php", {
      credentials: "same-origin",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Pesanan tidak dapat dimuat.");
    renderCustomerOrders(data.orders);
  } catch (error) {
    $("#orders-message").textContent = error.message;
  }
}

async function hideCustomerOrderHistory(button) {
  if (!confirm("Sembunyikan riwayat ini di browser ini? Data tetap tersimpan dan bisa dilihat admin.")) return;

  try {
    localStorage.setItem(hiddenOrderKey(button.dataset.orderHistoryHide), "1");
    await openCustomerOrders();
  } catch (error) {
    $("#orders-message").textContent = error.message;
  }
}

function initModal() {
  // Buka popup dari tombol/kartu mana pun yang punya data-o
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-o]");
    if (trigger) openModal(trigger.dataset.o);
  });

  // Klik di dalam popup: tutup (area gelap) atau pilih nominal/pembayaran
  $("#ov").addEventListener("click", (e) => {
    if (e.target.id === "ov") return closeModal();

    const btn = e.target.closest("[data-p],[data-m],[data-product-id]");
    if (!btn) return;

    btn.parentNode.querySelectorAll(".opt").forEach((x) => x.classList.remove("on"));
    btn.classList.add("on");

    if (btn.dataset.productId != null) {
      selectedProduct = currentProducts.find((product) => String(product.id) === btn.dataset.productId) || null;
      selectedPackage = null;
    } else if (btn.dataset.p != null) {
      selectedPackage = +btn.dataset.p;
      selectedProduct = null;
    } else {
      selectedPayment = btn.dataset.m;
    }
    updateSummary();
  });

  $("#un").addEventListener("input", updateSummary);
  $("#cl").addEventListener("click", closeModal);
  $("#ok2").addEventListener("click", closeModal);
  $("#go").addEventListener("click", submitOrder);
  $("#orders-open").addEventListener("click", openCustomerOrders);
  $("#show-orders").addEventListener("click", () => {
    closeModal();
    openCustomerOrders();
  });
  $("#orders-close").addEventListener("click", () => $("#orders-modal").classList.remove("on"));
  $("#orders-modal").addEventListener("click", (e) => {
    if (e.target.id === "orders-modal") $("#orders-modal").classList.remove("on");
    const hideButton = e.target.closest("[data-order-history-hide]");
    if (hideButton) hideCustomerOrderHistory(hideButton);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      $("#orders-modal").classList.remove("on");
    }
  });
}
