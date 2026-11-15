/* ==========================================================
   modal.js — popup top up (pilih nominal, username, pembayaran)
   Catatan: ini masih demo. Sambungkan submitOrder() ke backend
   / payment gateway kamu untuk transaksi sungguhan.
   ========================================================== */

let currentPackages = ROBUX_PACKAGES;
let selectedPackage = null;
let selectedPayment = null;

// Update total bayar & status tombol "Bayar Sekarang"
function updateSummary() {
  $("#tt").textContent =
    selectedPackage == null ? "Rp0" : formatRupiah(currentPackages[selectedPackage][1]);

  const usernameValid = $("#un").value.trim().length >= 3;
  $("#go").disabled = !(selectedPackage != null && selectedPayment && usernameValid);
}

function closeModal() {
  $("#ov").classList.remove("on");
}

// key: "p0" = produk index 0, "g3" = game index 3
function openModal(key) {
  const isGame = key[0] === "g";
  const index = +key.slice(1);
  const name = (isGame ? GAMES[index] : PRODUCTS[index])[0];

  currentPackages = !isGame && ROBUX_PRODUCT_INDEXES.includes(index) ? ROBUX_PACKAGES : ITEM_PACKAGES;
  selectedPackage = selectedPayment = null;

  $("#mt").textContent = "Top Up " + name;
  $("#ms").textContent = isGame
    ? "Item dan mata uang in-game · proses instan"
    : "Pilih nominal, isi username, selesai dalam hitungan menit";

  $("#po").innerHTML = currentPackages
    .map(([label, price], j) => `<button class="opt" data-p="${j}">${label}<small>${formatRupiah(price)}</small></button>`)
    .join("");
  $("#pm").innerHTML = PAYMENTS.map((p) => `<button class="opt" data-m="${p}">${p}</button>`).join("");

  $("#un").value = "";
  $("#fm").hidden = false;
  $("#ok").hidden = true;
  $("#ov").classList.add("on");
  updateSummary();
}

function submitOrder() {
  const [label, price] = currentPackages[selectedPackage];
  const orderId = "VS-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  $("#fm").hidden = true;
  $("#ok").hidden = false;
  $("#oi").textContent =
    `Order ${orderId} · ${label} untuk ${$("#un").value.trim()} via ${selectedPayment} · ${formatRupiah(price)}. ` +
    "Ini masih demo frontend, belum terhubung ke payment gateway.";
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

    const btn = e.target.closest("[data-p],[data-m]");
    if (!btn) return;

    btn.parentNode.querySelectorAll(".opt").forEach((x) => x.classList.remove("on"));
    btn.classList.add("on");

    if (btn.dataset.p != null) selectedPackage = +btn.dataset.p;
    else selectedPayment = btn.dataset.m;
    updateSummary();
  });

  $("#un").addEventListener("input", updateSummary);
  $("#cl").addEventListener("click", closeModal);
  $("#ok2").addEventListener("click", closeModal);
  $("#go").addEventListener("click", submitOrder);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}
