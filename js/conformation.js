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
const moneyTL = (n) => `${money(n)} TL`;
const formatQtyValue = (qty) => {
  const raw = typeof qty === "string" ? qty.replace(",", ".") : qty;
  const n = Number(raw || 0);
  if (!isFinite(n)) return "0";
  return parseFloat(n.toFixed(2)).toString();
};

function resolveMode(it) {
  if (typeof it.sellMode === "number") return it.sellMode;
  if (it.unit === "كجم") return 1;
  return 0;
}

function qtyForMessage(it) {
  const mode = resolveMode(it);
  if (mode === 1) return `${formatQtyValue(it.qty)} كجم`;
  if (mode === 2) {
    const pieces = Math.max(1, Math.floor(Number(it.qty) || 0));
    const approx = it.approxKg > 0 ? ` (~${it.approxKg} كجم/قطعة)` : "";
    return `${pieces} قطعة${approx}`;
  }
  if (String(it.unit || "").includes("كجم"))
    return `${formatQtyValue(it.qty)} ${it.unit}`.trim();
  const pieces = Math.max(1, Math.floor(Number(it.qty) || 0));
  return `${pieces} ${it.unit && it.unit !== "قطعة" ? it.unit : "عدد"}`.trim();
}

function priceLabelForMessage(it) {
  const mode = resolveMode(it);
  if (mode === 0 && it.unit && !it.unit.includes("كجم")) return "سعر القطعة";
  return "سعر الكيلو";
}

function saveDraft() {
  try {
    localStorage.setItem("orderDraft", JSON.stringify(order));
  } catch {}
}
function lineTotal(it) {
  const price = toNum(it.price, 0);
  const qty = toNum(it.qty, 0);
  const mode = resolveMode(it);
  if (mode === 2) {
    const approx = toNum(it.approxKg, 0);
    if (approx > 0) {
      return price * approx * Math.max(1, Math.floor(qty || 0));
    }
    return 0;
  }
  if (mode === 1) {
    return price * qty;
  }
  return price * Math.max(1, Math.floor(qty || 0));
}

function calcTotal() {
  return order.items.reduce((sum, it) => sum + lineTotal(it), 0);
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
    const nameWrap = document.createElement("div");
    nameWrap.className = "cell-title";
    nameWrap.textContent = it.name || "-";
    tdName.appendChild(nameWrap);
    const extras = [];
    if (it.cut) extras.push(`تقطيع: ${it.cut}`);
    if (it.note) extras.push(`ملاحظة: ${it.note}`);
    if (!extras.length && /\((.+)\)/.test(it.name || "")) {
      const match = (it.name || "").match(/\((.+)\)/);
      if (match && match[1]) extras.push(match[1]);
    }
    if (extras.length) {
      const extraEl = document.createElement("div");
      extraEl.className = "cell-extra";
      extraEl.textContent = extras.join(" • ");
      tdName.appendChild(extraEl);
    }

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
      tdLine.textContent = moneyTL(lineTotal(it));
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
    tdLine.dataset.label = "الإجمالي التقريبي";
    tdLine.className = "ltr-text";
    tdLine.textContent = moneyTL(lineTotal(it));

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

/* ===== خريطة OpenStreetMap (Leaflet) ===== */
let marker = null;
let chosenLatLng = null;
let map = null;
let mapReady = false;

function updateCoordsHint(text) {
  const hint = $("#coordsHint");
  if (hint) hint.textContent = text;
}

function placeMarker(latLng) {
  if (!mapReady || !map || typeof L === "undefined") return;
  const pos = Array.isArray(latLng)
    ? { lat: latLng[0], lng: latLng[1] }
    : { lat: latLng.lat, lng: latLng.lng };
  if (!isFinite(pos.lat) || !isFinite(pos.lng)) return;
  if (marker) marker.remove();
  marker = L.marker([pos.lat, pos.lng]).addTo(map);
  chosenLatLng = { lat: pos.lat, lng: pos.lng };
  updateCoordsHint(
    `الموقع المحدد: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`
  );
}

function initLeafletMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;
  if (typeof L === "undefined") {
    updateCoordsHint(
      "تعذّر تحميل خريطة OpenStreetMap. تأكد من الاتصال بالإنترنت ثم حدِّث الصفحة."
    );
    return;
  }

  const defaultCenter = [41.029, 28.72];
  map = L.map(mapEl, { zoomControl: true }).setView(defaultCenter, 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  map.on("click", (e) => placeMarker(e.latlng));
  mapReady = true;
  updateCoordsHint("لم يتم اختيار موقع بعد.");
}

if (document.getElementById("map")) {
  updateCoordsHint("جاري تحميل خريطة OpenStreetMap...");
  initLeafletMap();
}

const geoBtn = $("#geoBtn");
if (geoBtn) {
  geoBtn.addEventListener("click", () => {
    if (!mapReady || !map) {
      return toast("جاري تحميل خريطة OpenStreetMap، برجاء المحاولة بعد لحظات.");
    }
    if (!navigator.geolocation)
      return toast("المتصفح لا يدعم تحديد الموقع.", "error");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setView([ll.lat, ll.lng], 16);
        placeMarker(ll);
      },
      () => toast("تعذّر تحديد الموقع. اختره يدويًا من الخريطة.", "error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

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
    (document.querySelector('input[name="pay"]:checked') || {}).value || "نقدًا";
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
    const parts = [
      `• ${it.name}`,
      `      ${priceLabelForMessage(it)}: ${moneyTL(it.price)}`,
      `      الكمية: ${qtyForMessage(it)}`,
    ];
    if (it.cut) parts.push(`      طريقة التقطيع: ${it.cut}`);
    if (it.note) parts.push(`      ملاحظة: ${it.note}`);
    return parts.join("\n");
  });

  const totalLine = `💰 الإجمالي التقريبي: ${moneyTL(calcTotal())}`;
  const approxNote =
    "ℹ️ ملاحظة: الإجمالي تقريبي وقد يحدث فرق بسيط باختلاف الوزن.";
  const header = `طلب جديد من ${order.brand || "مزارع البركات"} 🌿🐄`;

  const customerBlock = [`👤 الاسم: ${name}`, `📞 الهاتف: ${phone}`];

  let addressLine = "";
  let locationLines = [];
  let payLine = `💳 طريقة الدفع: ${pay}`;

  if (deliveryType === "pickup") {
    addressLine = "🏪 طريقة الاستلام: استلام من المحل";
    locationLines = [];
  } else {
    const mapLink = chosenLatLng
      ? `https://www.openstreetmap.org/?mlat=${chosenLatLng.lat}&mlon=${chosenLatLng.lng}#map=17/${chosenLatLng.lat}/${chosenLatLng.lng}`
      : "";
    addressLine = `🏠 العنوان: ${address || "لم يُذكر"}`;
    locationLines = mapLink
      ? [
          `📍 الموقع على الخريطة: ${mapLink}`,
          `🧭 اللوكيشن: ${mapLink}`,
        ]
      : [];
  }

  const msg = [
    header,
    "",
    "🧾 تفاصيل الطلب:",
    ...lines,
    "",
    totalLine,
    "",
    ...customerBlock,
    addressLine,
    ...locationLines,
    payLine,
    approxNote,
  ]
    .filter(Boolean)
    .join("\n");

  const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.location.href = waURL;
});

(() => {
  const btn = document.getElementById("backToTopConfirm");
  if (!btn) return;
  const toggle = () => {
    if (window.scrollY > 240) btn.classList.add("show");
    else btn.classList.remove("show");
  };
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", toggle, { passive: true });
  toggle();
})();
