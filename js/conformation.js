const fallbackI18n = {
  t: (key) => key,
  onChange: () => () => {},
};

const getI18n = () => window.i18n || fallbackI18n;

const t = (key, params) => {
  const api = getI18n();
  return typeof api.t === "function" ? api.t(key, params) : key;
};

const onLangChange = (handler) => {
  const api = getI18n();
  return typeof api.onChange === "function" ? api.onChange(handler) : () => {};
};

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
const CART_KEY = "elb_cart_v1";
const $ = (sel) => document.querySelector(sel);

const DIGIT_MAP = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};
const normalizeDigits = (value = "") =>
  String(value).replace(/[٠-٩۰-۹]/g, (d) => DIGIT_MAP[d] ?? d);
const sanitizeNumericInput = (value = "", allowDecimal = false) => {
  if (value == null) return "";
  const normalized = normalizeDigits(value)
    .replace(/[\u066C\s\u00A0]/g, "") // remove Arabic thousands separator & spaces
    .replace(/[\u060C\u061B]/g, "")
    .replace(/\u066B/g, ".");

  if (!allowDecimal)
    return normalized.replace(/[.,٫٬،]/g, "").replace(/[^0-9]/g, "");

  const prepared = normalized
    .replace(/[٫٬،]/g, ".")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const [lead, ...rest] = prepared.split(".");
  return lead + (rest.length ? "." + rest.join("") : "");
};
const bindNumericInput = (el, opts = {}) => {
  if (!el) return;
  const allowDecimal = () =>
    typeof opts.allowDecimal === "function"
      ? opts.allowDecimal()
      : Boolean(opts.allowDecimal);

  const coerce = () => {
    const { selectionStart, selectionEnd } = el;
    const cleaned = sanitizeNumericInput(el.value, allowDecimal());
    if (cleaned !== el.value) {
      el.value = cleaned;
      if (el.setSelectionRange) {
        const caret = selectionStart ?? cleaned.length;
        const endCaret = selectionEnd ?? caret;
        requestAnimationFrame(() =>
          el.setSelectionRange(
            Math.min(caret, cleaned.length),
            Math.min(endCaret, cleaned.length)
          )
        );
      }
    }
  };

  el.lang = "en";
  el.dir = "ltr";
  el.autocapitalize = "off";
  el.setAttribute("autocorrect", "off");
  if (!el.getAttribute("autocomplete")) el.setAttribute("autocomplete", "off");
  if (typeof el.spellcheck !== "undefined") el.spellcheck = false;
  if (!el.getAttribute("inputmode"))
    el.setAttribute("inputmode", allowDecimal() ? "decimal" : "numeric");

  el.addEventListener("beforeinput", (evt) => {
    if (!evt.data) return;
    const sanitized = sanitizeNumericInput(evt.data, allowDecimal());
    if (sanitized === evt.data) return;
    evt.preventDefault();
    if (!sanitized) return;
    const value = el.value || "";
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const nextValue = value.slice(0, start) + sanitized + value.slice(end);
    el.value = nextValue;
    const caret = start + sanitized.length;
    requestAnimationFrame(() => {
      if (el.setSelectionRange) el.setSelectionRange(caret, caret);
      coerce();
    });
  });

  el.addEventListener("input", coerce);
  el.addEventListener("blur", coerce);
  el.addEventListener("focus", () => {
    requestAnimationFrame(() => {
      if (document.activeElement === el && el.select) {
        try {
          el.select();
        } catch (_) {}
      }
    });
  });
  coerce();
};

/* قراءة المسودة */
let order = null;
try {
  order = JSON.parse(localStorage.getItem("orderDraft") || "null");
} catch {}
if (!order || !order.items || !order.items.length) {
  toast(t("confirm.toast.noDraft"), "error");
  window.location.href = "menu.html";
}

let cartSnapshot = [];
try {
  cartSnapshot = JSON.parse(localStorage.getItem(CART_KEY) || "null") || [];
} catch {}

if (order && Array.isArray(order.items) && cartSnapshot.length) {
  const map = new Map(
    cartSnapshot.map((item) => [
      `${item?.name || ""}__${item?.cut || ""}`,
      item,
    ])
  );
  order.items.forEach((it) => {
    const key = `${it?.name || ""}__${it?.cut || ""}`;
    const src = map.get(key);
    if (src) {
      if (!it.category && src.category) it.category = src.category;
      if (!it.image && src.image) it.image = src.image;
      if (typeof it.sellMode === "undefined" && src.sellMode != null)
        it.sellMode = src.sellMode;
      if ((!it.approxKg || !Number(it.approxKg)) && src.approxKg)
        it.approxKg = src.approxKg;
    }
    if (typeof it.sellMode === "undefined") {
      if (it.unit === "كجم" || it.unit === "kg") it.sellMode = 1;
      else it.sellMode = 0;
    }
  });
}

/* ===== عناصر الصفحة ===== */
const tbody = $("#itemsBody");
const totalEl = $("#totalAmount");
const brandDisplay = order?.brand
  ? t("confirm.summary.store", { brand: order.brand })
  : "";
$("#brandName").textContent = brandDisplay;
if (order?.waNumber) WA_NUMBER = order.waNumber;

const addressGroup = $("#addressGroup");
const payGroup = $("#payGroup");
const payPlaceholder = document.querySelector(".chip-placeholder");
const payInputs = Array.from(
  document.querySelectorAll('input[name="pay"]')
);
const mapCard = $("#mapCard");
const sendBtn = $("#sendBtn");
const phoneInput = $("#custPhone");

bindNumericInput(phoneInput);
if (phoneInput) {
  phoneInput.addEventListener("blur", () => {
    phoneInput.value = sanitizeNumericInput(phoneInput.value, false);
  });
}

/* ===== Utilities ===== */
const toNum = (v, def = 0) => {
  if (v == null) return def;
  const cleaned = sanitizeNumericInput(v, true);
  const n = parseFloat(cleaned);
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

const translatePayMethod = (value = "") => {
  const v = value.trim();
  if (!v) return "";
  const lower = v.toLowerCase();
  if (
    v === "نقدًا" ||
    lower.includes("nakit") ||
    lower.includes("cash") ||
    lower.includes("نقد") ||
    lower.includes("كاش")
  )
    return t("confirm.form.payment.cash");
  if (
    v.includes("POS") ||
    lower.includes("pos") ||
    lower.includes("kredi") ||
    lower.includes("card") ||
    lower.includes("kart")
  )
    return t("confirm.form.payment.pos");
  return v;
};

function resolveMode(it) {
  if (typeof it.sellMode === "number") return it.sellMode;
  const unit = (it.unit || "").toLowerCase();
  if (unit.includes("كجم") || unit.includes("kg")) return 1;
  return 0;
}

function unitLabel(it) {
  const unitRaw = (it.unit || "").trim();
  const unitLower = unitRaw.toLowerCase();
  const mode = resolveMode(it);
  if (mode === 1) return t("menu.units.kg");
  if (mode === 2) return t("menu.units.piecePlural");
  if (!unitRaw) return t("menu.units.count");
  if (unitLower === "piece" || unitRaw === "قطعة") return t("menu.units.piece");
  if (unitLower === "عدد") return t("menu.units.count");
  if (unitLower.includes("kg") || unitLower.includes("كجم"))
    return t("menu.units.kg");
  return unitRaw;
}

function qtyForMessage(it) {
  const mode = resolveMode(it);
  if (mode === 1) return `${formatQtyValue(it.qty)} ${t("menu.units.kg")}`;
  if (mode === 2) {
    const pieces = Math.max(1, Math.floor(Number(it.qty) || 0));
    const approx =
      it.approxKg > 0
        ? t("menu.units.approxPieceKg", { kg: formatQtyValue(it.approxKg) })
        : "";
    return `${pieces} ${t("menu.units.piecePlural")}${approx}`;
  }
  if ((it.unit || "").toLowerCase().includes("kg") || (it.unit || "").includes("كجم"))
    return `${formatQtyValue(it.qty)} ${t("menu.units.kg")}`;
  const pieces = Math.max(1, Math.floor(Number(it.qty) || 0));
  return `${pieces} ${unitLabel(it)}`;
}

function priceLabelForMessage(it) {
  const mode = resolveMode(it);
  if (mode === 0 && !(it.unit || "").toLowerCase().includes("kg"))
    return t("menu.price.unitPiece");
  return t("menu.price.unitKg");
}

function buildCartSnapshot() {
  if (!order || !Array.isArray(order.items)) return [];
  return order.items.map((it) => {
    const mode = resolveMode(it);
    let qty = toNum(it.qty, mode === 1 ? 0.1 : 1);
    if (mode === 1) qty = Math.max(0.1, Math.round(qty * 100) / 100);
    else qty = Math.max(1, Math.floor(qty));

    return {
      name: it.name,
      category: it.category || "",
      image: it.image || "",
      price: toNum(it.price, 0),
      cut: it.cut || "",
      note: it.note || "",
      qty,
      sellMode: mode,
      approxKg: toNum(it.approxKg, 0),
    };
  });
}

function syncCartStorage() {
  try {
    const snapshot = buildCartSnapshot();
    if (snapshot.length) localStorage.setItem(CART_KEY, JSON.stringify(snapshot));
    else localStorage.removeItem(CART_KEY);
  } catch (err) {
    console.error("cart sync error:", err);
  }
}

function saveDraft() {
  try {
    if (order && Array.isArray(order.items) && order.items.length) {
      order.total = calcTotal();
      localStorage.setItem("orderDraft", JSON.stringify(order));
    } else {
      localStorage.removeItem("orderDraft");
    }
  } catch {}
  syncCartStorage();
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
    const mode = resolveMode(it);

    const tdName = document.createElement("td");
    tdName.dataset.label = t("confirm.summary.table.item");
    const nameWrap = document.createElement("div");
    nameWrap.className = "cell-title";
    nameWrap.textContent = it.name || "-";
    tdName.appendChild(nameWrap);
    const extras = [];
    if (it.cut) extras.push(`${t("menu.cart.meta.cut")}: ${it.cut}`);
    if (it.note) extras.push(`${t("menu.cart.meta.note")}: ${it.note}`);
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
    tdQty.dataset.label = t("confirm.summary.table.qty");
    const isDecimal = mode === 1;
    const step = isDecimal ? 0.1 : 1;

    const box = document.createElement("div");
    box.className = "qtybox";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    const input = document.createElement("input");
    input.type = "text";
    input.step = String(step);
    input.min = String(isDecimal ? 0.1 : 1);
    input.value = String(it.qty ?? (isDecimal ? 0.1 : 1));
    const inputMode = isDecimal ? "decimal" : "numeric";
    input.inputMode = inputMode;
    input.setAttribute("inputmode", inputMode);
    input.pattern = isDecimal ? "[0-9.,٫٬،]*" : "[0-9]*";
    input.autocomplete = "off";
    input.classList.add("numeric-input");
    input.lang = "en";
    input.dir = "ltr";
    bindNumericInput(input, { allowDecimal: () => isDecimal });
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    const unit = document.createElement("span");
    unit.style.marginInlineStart = "6px";
    unit.textContent = unitLabel(it);

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
    tdPrice.dataset.label = t("confirm.summary.table.price");
    tdPrice.className = "ltr-text";
    tdPrice.textContent = `${money(it.price)} TL`;

    const tdLine = document.createElement("td");
    tdLine.dataset.label = t("confirm.summary.table.total");
    tdLine.className = "ltr-text";
    tdLine.textContent = moneyTL(lineTotal(it));

    const tdDel = document.createElement("td");
    tdDel.dataset.label = t("confirm.summary.table.delete");
    const del = document.createElement("button");
    del.className = "del-btn";
    del.setAttribute("aria-label", t("confirm.summary.table.delete"));
    del.innerHTML = '<i class="fa-solid fa-trash"></i>';
    del.addEventListener("click", () => {
      order.items.splice(idx, 1);
      if (!order.items.length) {
        saveDraft();
        toast(t("confirm.toast.allRemoved"), "success");
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
  const total = calcTotal();
  totalEl.textContent = money(total);
  if (order) order.total = total;
  const brandText = order?.brand
    ? t("confirm.summary.store", { brand: order.brand })
    : "";
  $("#brandName").textContent = brandText;
}
renderRows();
syncCartStorage();

/* ===== خريطة OpenStreetMap (Leaflet) ===== */
let marker = null;
let chosenLatLng = null;
let map = null;
let mapReady = false;
let leafletLoaded = false;
let leafletSourceIndex = 0;

const LEAFLET_CSS_URLS = [
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
];

const LEAFLET_JS_URLS = [
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

let mapHintState = { key: "confirm.map.hint.empty", params: null };

function applyMapHint() {
  const hint = $("#coordsHint");
  if (!hint) return;
  const { key, params } = mapHintState || {};
  hint.textContent = t(key || "confirm.map.hint.empty", params);
}

function setMapHint(key, params) {
  mapHintState = { key, params };
  applyMapHint();
}

function ensureLeafletCSS() {
  const head = document.head || document.getElementsByTagName("head")[0];
  if (!head) return;
  const alreadyLoaded = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  ).some((link) =>
    LEAFLET_CSS_URLS.some((url) => link.href && link.href.includes(url))
  );
  if (alreadyLoaded) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS_URLS[0];
  head.appendChild(link);
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
  setMapHint("confirm.map.hint.selected", {
    lat: pos.lat.toFixed(6),
    lng: pos.lng.toFixed(6),
  });
}

function initLeafletMap() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;
  if (mapReady && map) {
    setTimeout(() => map.invalidateSize(), 50);
    return;
  }
  if (typeof L === "undefined") {
    setMapHint("confirm.toast.mapLoadError");
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
  leafletLoaded = true;
  setMapHint("confirm.map.hint.empty");
  setTimeout(() => map.invalidateSize(), 100);
}

function loadLeafletLibrary() {
  if (leafletLoaded || typeof L !== "undefined") {
    initLeafletMap();
    return;
  }
  if (leafletSourceIndex >= LEAFLET_JS_URLS.length) {
    setMapHint("confirm.toast.mapLoadError");
    return;
  }

  const script = document.createElement("script");
  script.src = LEAFLET_JS_URLS[leafletSourceIndex++];
  script.async = true;
  script.onload = () => {
    if (typeof L !== "undefined") {
      initLeafletMap();
    } else {
      loadLeafletLibrary();
    }
  };
  script.onerror = () => {
    loadLeafletLibrary();
  };
  (document.head || document.body || document.documentElement).appendChild(
    script
  );
}

if (document.getElementById("map")) {
  setMapHint("confirm.map.hint.loading");
  ensureLeafletCSS();
  loadLeafletLibrary();
}

const geoBtn = $("#geoBtn");
if (geoBtn) {
  geoBtn.addEventListener("click", () => {
    if (!mapReady || !map) {
      return toast(t("confirm.toast.mapLoading"));
    }
    if (!navigator.geolocation)
      return toast(t("confirm.toast.geoUnsupported"), "error");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setView([ll.lat, ll.lng], 16);
        placeMarker(ll);
      },
      () => toast(t("confirm.toast.geoFailed"), "error"),
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

  if (addressGroup) addressGroup.style.display = isPickup ? "none" : "";
  if (payGroup) payGroup.style.display = "";
  if (mapCard) mapCard.style.display = isPickup ? "none" : "";

  if (sendBtn) {
    const label = isPickup
      ? t("confirm.actions.sendPickup")
      : t("common.actions.sendWhatsApp");
    sendBtn.innerHTML = `<i class="fa-brands fa-whatsapp"></i> ${label}`;
  }
}
document
  .querySelectorAll('input[name="deliveryType"]')
  .forEach((r) => r.addEventListener("change", toggleDeliveryUI));
toggleDeliveryUI();

function updatePayPlaceholder() {
  if (!payPlaceholder) return;
  const selected = document.querySelector('input[name="pay"]:checked');
  payPlaceholder.classList.toggle("hidden", Boolean(selected));
}

payInputs.forEach((input) =>
  input.addEventListener("change", () => {
    updatePayPlaceholder();
  })
);
updatePayPlaceholder();

onLangChange(() => {
  renderRows();
  toggleDeliveryUI();
  applyMapHint();
  updatePayPlaceholder();
});

/* ===== إرسال واتساب ===== */
sendBtn.addEventListener("click", () => {
  const name = $("#custName").value.trim();
  const phoneField = $("#custPhone");
  const phone = sanitizeNumericInput(phoneField ? phoneField.value.trim() : "", false);
  if (phoneField) phoneField.value = phone;
  const address = $("#custAddress") ? $("#custAddress").value.trim() : "";
  const payInput = document.querySelector('input[name="pay"]:checked');
  const pay = payInput ? payInput.value : "";
  const payLabelKey = payInput
    ? payInput
        .closest("label")
        ?.querySelector("[data-i18n]")
        ?.getAttribute("data-i18n")
    : null;
  const deliveryType =
    (document.querySelector('input[name="deliveryType"]:checked') || {})
      .value || "delivery";

  // تحقق جميل
  if (!name) return toast(t("confirm.toast.needName"), "error");
  if (!phone) return toast(t("confirm.toast.needPhone"), "error");

  if (deliveryType === "delivery" && !address)
    return toast(t("confirm.toast.needAddress"), "error");

  if (!pay) return toast(t("confirm.toast.needPayment"), "error");

  const lines = order.items.map((it) => {
    const parts = [
      `• ${it.name}`,
      `      ${priceLabelForMessage(it)}: ${moneyTL(it.price)}`,
      `      ${t("menu.whatsapp.quantity")}: ${qtyForMessage(it)}`,
    ];
    if (it.cut) parts.push(`      ${t("confirm.whatsapp.cut")}: ${it.cut}`);
    if (it.note) parts.push(`      ${t("confirm.whatsapp.note")}: ${it.note}`);
    return parts.join("\n");
  });

  const totalLine = t("confirm.whatsapp.total", {
    total: moneyTL(calcTotal()),
  });
  const approxNote = t("confirm.whatsapp.noteLine");
  const header = t("confirm.whatsapp.header", {
    brand: order.brand || t("common.brandName"),
  });

  const customerBlock = [
    t("confirm.whatsapp.customer", { name }),
    t("confirm.whatsapp.phone", { phone }),
  ];

  let addressLine = "";
  let locationLines = [];
  const payTranslated = payLabelKey ? t(payLabelKey) : translatePayMethod(pay);
  const payLine = payTranslated
    ? t("confirm.whatsapp.payment", { method: payTranslated })
    : "";

  if (deliveryType === "pickup") {
    addressLine = t("confirm.whatsapp.pickup");
    locationLines = [];
  } else {
    const mapLink = chosenLatLng
      ? `https://maps.google.com/?q=${chosenLatLng.lat},${chosenLatLng.lng}`
      : "";
    addressLine = t("confirm.whatsapp.address", {
      address: address || t("confirm.whatsapp.addressFallback"),
    });
    locationLines = mapLink
      ? [t("confirm.whatsapp.location", { link: mapLink })]
      : [];
  }

  const msgParts = [
    header,
    "",
    t("confirm.whatsapp.details"),
    ...lines,
    "",
    totalLine,
    "",
    ...customerBlock,
    "",
    addressLine,
  ];

  if (locationLines.length) {
    msgParts.push("", ...locationLines);
  }

  if (payLine) {
    msgParts.push("", payLine);
  }

  msgParts.push("", approxNote);

  const msg = msgParts
    .filter((line) => line !== null && line !== undefined && line !== false)
    .join("\n");

  const waURL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  try {
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem("orderDraft");
  } catch (err) {
    console.error("clear storage error:", err);
  }
  if (order && Array.isArray(order.items)) order.items.length = 0;
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
