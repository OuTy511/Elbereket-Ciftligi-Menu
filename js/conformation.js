/* ===== منيو الموبايل (نفس menu.js لعمل التوجل هنا) ===== */
const btn = document.querySelector(".menu-toggle");
const navMobile = document.querySelector(".nav-mobile");
const list = document.querySelector(".nav-mobile .navm-list");
if (btn && navMobile && list) {
  const toggleMenu = () => {
    const isOpen = navMobile.classList.toggle("open");
    btn.classList.toggle("active", isOpen);
    btn.setAttribute("aria-expanded", String(isOpen));
    list.style.maxHeight = isOpen ? list.scrollHeight + "px" : null;
  };
  btn.addEventListener("click", toggleMenu);
  navMobile.addEventListener("click", (e) => {
    if (e.target.tagName === "A") toggleMenu();
  });
}

/* ===== إعدادات عامة ===== */
let WA_NUMBER = "905524821848"; // سيتبدل لو موجود في orderDraft
const $ = (sel) => document.querySelector(sel);

/* قراءة المسودة */
let order = null;
try {
  order = JSON.parse(localStorage.getItem("orderDraft") || "null");
} catch {}
if (!order || !order.items || !order.items.length) {
  toast("لا يوجد طلب قيد التأكيد. سيتم الرجوع للمنيو.", "error");
  window.location.href = "menu.html";
}

/* ===== عناصر الصفحة ===== */
const tbody = $("#itemsBody");
const totalEl = $("#totalAmount");
$("#brandName").textContent = order?.brand ? `المتجر: ${order.brand}` : "";
if (order?.waNumber) WA_NUMBER = order.waNumber;

const addressGroup = $("#addressGroup");
const payGroup = $("#payGroup");
const mapCard = $("#mapCard");
const sendBtn = $("#sendBtn");

/* ===== Utilities ===== */
const toNum = (v, def = 0) => {
  if (v == null) return def;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? def : n;
};
const money = (n) => Number(n || 0).toFixed(2);

function saveDraft() {
  try {
    localStorage.setItem("orderDraft", JSON.stringify(order));
  } catch {}
}
function calcTotal() {
  return order.items.reduce(
    (s, it) => s + toNum(it.qty, 0) * toNum(it.price, 0),
    0
  );
}

/* ===== Toast رسائل أنيقة بدل alert ===== */
function toast(msg, type = "error") {
  const wrap = $("#toast");
  if (!wrap) return alert(msg);
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fa-solid ${
    type === "error" ? "fa-circle-exclamation" : "fa-circle-check"
  }"></i> ${msg}`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

/* ===== جدول الملخص مع تعديل الكمية/الحذف ===== */
function renderRows() {
  tbody.innerHTML = "";
  order.items.forEach((it, idx) => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.dataset.label = "الصنف";
    tdName.textContent = it.name || "-";

    const tdQty = document.createElement("td");
    tdQty.dataset.label = "الكمية";
    const isDecimal = it.unit === "كجم" || String(it.qty).includes(".");
    const step = isDecimal ? 0.1 : 1;

    const box = document.createElement("div");
    box.className = "qtybox";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    const input = document.createElement("input");
    input.type = "number";
    input.step = String(step);
    input.min = String(isDecimal ? 0.1 : 1);
    input.value = String(it.qty ?? (isDecimal ? 0.1 : 1));
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    const unit = document.createElement("span");
    unit.style.marginInlineStart = "6px";
    unit.textContent = it.unit || "";

    function clamp(val) {
      let n = toNum(val, isDecimal ? 0.1 : 1);
      if (isDecimal) n = Math.max(0.1, Math.round(n * 10) / 10);
      else n = Math.max(1, Math.floor(n));
      return n;
    }
    function updateQty(v) {
      const n = clamp(v);
      it.qty = n;
      input.value = String(n);
      tdLine.textContent = `${money(n * toNum(it.price, 0))} TL`;
      totalEl.textContent = money(calcTotal());
      saveDraft();
    }
    minus.addEventListener("click", () =>
      updateQty(toNum(input.value, 1) - step)
    );
    plus.addEventListener("click", () =>
      updateQty(toNum(input.value, 1) + step)
    );
    input.addEventListener("change", () => updateQty(input.value));

    box.append(minus, input, plus);
    tdQty.append(box, unit);

    const tdPrice = document.createElement("td");
    tdPrice.dataset.label = "السعر/وحدة";
    tdPrice.className = "ltr-text";
    tdPrice.textContent = `${money(it.price)} TL`;

    const tdLine = document.createElement("td");
    tdLine.dataset.label = "الإجمالي";
    tdLine.className = "ltr-text";
    tdLine.textContent = `${money(toNum(it.qty, 1) * toNum(it.price, 0))} TL`;

    const tdDel = document.createElement("td");
    tdDel.dataset.label = "حذف";
    const del = document.createElement("button");
    del.className = "del-btn";
    del.innerHTML = '<i class="fa-solid fa-trash"></i>';
    del.addEventListener("click", () => {
      order.items.splice(idx, 1);
      if (!order.items.length) {
        saveDraft();
        toast("تم حذف جميع الأصناف.", "success");
        return (window.location.href = "menu.html");
      }
      totalEl.textContent = money(calcTotal());
      saveDraft();
      renderRows();
    });
    tdDel.appendChild(del);

    tr.append(tdName, tdQty, tdPrice, tdLine, tdDel);
    tbody.appendChild(tr);
  });
  totalEl.textContent = money(calcTotal());
}
renderRows();

/* ===== Leaflet Map ===== */
let marker = null;
let chosenLatLng = null;
const map = L.map("map").setView([41.029, 28.72], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);
function placeMarker(latlng) {
  if (marker) map.removeLayer(marker);
  marker = L.marker(latlng).addTo(map);
  chosenLatLng = latlng;
  $("#coordsHint").textContent = `الموقع المحدد: ${latlng.lat.toFixed(
    6
  )}, ${latlng.lng.toFixed(6)}`;
}
map.on("click", (e) => placeMarker(e.latlng));
$("#geoBtn").addEventListener("click", () => {
  if (!navigator.geolocation)
    return toast("المتصفح لا يدعم تحديد الموقع.", "error");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.setView(ll, 16);
      placeMarker(ll);
    },
    () => toast("تعذّر تحديد الموقع. اختره يدويًا من الخريطة.", "error"),
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

/* ===== إخفاء/إظهار الحقول حسب طريقة الاستلام ===== */
function toggleDeliveryUI() {
  const mode =
    (document.querySelector('input[name="deliveryType"]:checked') || {})
      .value || "delivery";
  const isPickup = mode === "pickup";

  addressGroup.style.display = isPickup ? "none" : "";
  payGroup.style.display = isPickup ? "none" : "";
  mapCard.style.display = isPickup ? "none" : "";

  sendBtn.innerHTML = isPickup
    ? '<i class="fa-brands fa-whatsapp"></i> تأكيد الطلب (استلام من المحل)'
    : '<i class="fa-brands fa-whatsapp"></i> تأكيد وإرسال على واتساب';
}
document
  .querySelectorAll('input[name="deliveryType"]')
  .forEach((r) => r.addEventListener("change", toggleDeliveryUI));
toggleDeliveryUI();

/* ===== إرسال واتساب ===== */
sendBtn.addEventListener("click", () => {
  const name = $("#custName").value.trim();
  const phone = $("#custPhone").value.trim();
  const address = $("#custAddress") ? $("#custAddress").value.trim() : "";
  const pay =
    (document.querySelector('input[name="pay"]:checked') || {}).value || "كاش";
  const deliveryType =
    (document.querySelector('input[name="deliveryType"]:checked') || {})
      .value || "delivery";

  // تحقق جميل
  if (!name) return toast("من فضلك أدخل الاسم.", "error");
  if (!phone) return toast("من فضلك أدخل رقم الهاتف.", "error");

  if (deliveryType === "delivery") {
    if (!address && !chosenLatLng)
      return toast(
        "من فضلك أدخل العنوان أو حدِّد موقع التسليم على الخريطة.",
        "error"
      );
  }

  const lines = order.items.map((it) => {
    const qty = `${it.qty ?? 1}${it.unit ? " " + it.unit : ""}`;
    const price = `${money(it.price)}₺/${it.unit || ""}`.trim();
    const lineTotal = money(toNum(it.qty, 1) * toNum(it.price, 0));
    return `• ${it.name} — ${qty} — ${price} — الإجمالي: ${lineTotal}₺`;
  });

  const totalLine = `الإجمالي: ${money(calcTotal())}₺`;
  const header = `طلب جديد من ${order.brand || "المتجر"} 🐄🥩`;
  const customer = `👤 الاسم: ${name}\n📞 الهاتف: ${phone}`;

  let addressBlock = "";
  let payLine = "";
  let pinLine = "";

  if (deliveryType === "pickup") {
    addressBlock = "🏪 طريقة الاستلام: استلام من المحل (العميل سيحضر للموقع)";
  } else {
    const mapLink = chosenLatLng
      ? `https://maps.google.com/?q=${chosenLatLng.lat},${chosenLatLng.lng}`
      : "";
    addressBlock = address
      ? `📍 العنوان: ${address}`
      : chosenLatLng
      ? `📍 الموقع على الخريطة: ${mapLink}`
      : "";
    pinLine = chosenLatLng ? `📌 اللوكيشن: ${mapLink}` : "";
    payLine = `💳 طريقة الدفع: ${pay}`;
  }

  const msg = [
    header,
    "",
    "تفاصيل الطلب:",
    ...lines,
    "",
    totalLine,
    "",
    customer,
    addressBlock,
    pinLine,
    payLine,
  ]
    .filter(Boolean)
    .join("\n");

  const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.location.href = waURL;
});
