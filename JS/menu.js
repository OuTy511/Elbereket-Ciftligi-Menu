/* ===== منيو الموبايل ===== */
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

/* ===== Helpers ===== */
const CSV_PATH = "data/products.csv";
const placeholder = "https://placehold.co/1024x1024";
const priceFmt = (n) => `${(+n || 0).toLocaleString("tr-TR")}₺`;
const moneyTL = (n) =>
  `${Number(n || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`;
const formatQtyValue = (qty) => {
  const raw = typeof qty === "string" ? qty.replace(",", ".") : qty;
  const n = Number(raw || 0);
  if (!isFinite(n)) return "0";
  return parseFloat(n.toFixed(2)).toString();
};

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
  let v = normalizeDigits(value).replace(/[^0-9.,]/g, "");
  if (allowDecimal) {
    v = v.replace(/,/g, ".");
    const [lead, ...rest] = v.split(".");
    v = lead + (rest.length ? "." + rest.join("") : "");
  } else {
    v = v.replace(/[.,]/g, "");
  }
  return v;
};
const toNum = (v, def = 0) => {
  if (v == null) return def;
  const cleaned = sanitizeNumericInput(v, true);
  const n = parseFloat(cleaned);
  return isNaN(n) ? def : n;
};
const bindNumericInput = (el, opts = {}) => {
  if (!el) return;
  const allowDecimal = () =>
    typeof opts.allowDecimal === "function"
      ? opts.allowDecimal()
      : Boolean(opts.allowDecimal);
  el.addEventListener("input", () => {
    const cleaned = sanitizeNumericInput(el.value, allowDecimal());
    if (cleaned !== el.value) {
      el.value = cleaned;
      if (el.setSelectionRange) {
        const caret = cleaned.length;
        requestAnimationFrame(() => el.setSelectionRange(caret, caret));
      }
    }
  });
  el.addEventListener("focus", () => {
    requestAnimationFrame(() => {
      if (document.activeElement === el && el.select) el.select();
    });
  });
};

/* ===== عناصر الصفحة ===== */
const els = {
  categoryFilters: document.getElementById("categoryFilters"),
  filtersScroller: document.getElementById("filtersScroll"),
  filterArrows: document.querySelectorAll("[data-filter-arrow]"),
  searchInput: document.getElementById("searchInput"),
  offers: document.getElementById("offers"),
  offersGrid: document.getElementById("offersGrid"),
  menuGrid: document.getElementById("menuGrid"),

  cartFab: document.getElementById("cartFab"),
  scrollTop: document.getElementById("backToTopMenu"),
  cartDrawer: document.getElementById("cartDrawer"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  drawerClose: document.querySelector(".drawer-close"),
  cartItems: document.getElementById("cartItems"),
  cartTotal: document.getElementById("cartTotal"),
  waCheckout: document.getElementById("waCheckout"), // قد لا يكون موجود بعد التعديل
  goConfirm: document.getElementById("goConfirm"), // زر تأكيد الطلب الجديد (زر داخل الدرج)

  orderModal: document.getElementById("orderModal"),
  modalImg: document.getElementById("modalImg"),
  modalName: document.getElementById("modalName"),
  modalCat: document.getElementById("modalCat"),
  cutRow: document.getElementById("cutRow"),
  cutSelect: document.getElementById("cutSelect"),
  qtyInput: document.getElementById("qtyInput"),
  qtyMinus: document.getElementById("qtyMinus"),
  qtyPlus: document.getElementById("qtyPlus"),
  noteInput: document.getElementById("noteInput"),
  noteCount: document.getElementById("noteCount"),
  modalAdd: document.getElementById("modalAdd"),
  modalCancel: document.getElementById("modalCancel"),
  modalClose: document.querySelector(".modal-close"),
};

/* ===== حالة التطبيق ===== */
const state = {
  products: [],
  filtered: [],
  categories: [],
  activeCategory: "الكل",
  query: "",
  cart: [],
  modalProduct: null,
};

bindNumericInput(els.qtyInput, {
  allowDecimal: () => state.modalProduct?.sellMode === 1,
});

/* ===== تحميل CSV ===== */
if (window.Papa) {
  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: ({ data }) => {
      state.products = data
        .map((r) => ({
          name: (r["الاسم"] || "").trim(),
          category: (r["القسم"] || "").trim(),
          price: toNum(r["السعر"], 0),
          salePrice: toNum(r["سعر_الخصم"], 0),
          cuts: (r["خيارات_التقطيع"] || "").trim(),
          image: (r["الصورة"] || "").trim(),
          sellMode: Number((r["وضع_البيع"] || "0").trim()) || 0,
          approxKg: toNum(r["وزن_تقريبي_كجم"], 0),
        }))
        .filter((p) => p.name && p.category);

      state.categories = [
        "الكل",
        ...new Set(state.products.map((p) => p.category)),
      ];
      buildFilters();
      applyFilters();
      buildOffers();

      hydrateCart();
      updateCartUI();
    },
    error: (err) => {
      console.error("CSV error:", err);
      els.menuGrid.innerHTML = `<p class="muted">تعذر تحميل القائمة الآن. جرّب التحديث لاحقًا.</p>`;
    },
  });
} else {
  els.menuGrid.innerHTML = `<p class="muted">تعذر تحميل القائمة (مكتبة PapaParse غير متاحة).</p>`;
}

/* ===== الفلاتر والبحث ===== */
function buildFilters() {
  els.categoryFilters.innerHTML = "";
  state.categories.forEach((cat) => {
    const b = document.createElement("button");
    b.className =
      "filter-btn" + (cat === state.activeCategory ? " active" : "");
    b.type = "button";
    b.textContent = cat;
    b.addEventListener("click", () => {
      state.activeCategory = cat;
      document
        .querySelectorAll(".filter-btn")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      applyFilters();
    });
    els.categoryFilters.appendChild(b);
  });

  let qTimer;
  els.searchInput.addEventListener("input", () => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      state.query = els.searchInput.value.trim();
      applyFilters();
    }, 200);
  });
}

function setupFilterArrows() {
  if (!els.filtersScroller) return;
  const isRTL = document.documentElement?.dir === "rtl";
  const scroll = (dir) => {
    const base = els.filtersScroller.clientWidth || window.innerWidth || 320;
    const step = base * 0.7;
    const delta = dir * step * (isRTL ? -1 : 1);
    els.filtersScroller.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (els.filterArrows?.forEach) {
    els.filterArrows.forEach((btn) => {
      btn.addEventListener("click", () => {
        const dir = btn.dataset.filterArrow === "prev" ? -1 : 1;
        scroll(dir);
      });
    });
  }
}

function applyFilters() {
  const q = state.query.toLowerCase();
  state.filtered = state.products.filter((p) => {
    const byCat =
      state.activeCategory === "الكل" || p.category === state.activeCategory;
    const byQuery = !q || p.name.toLowerCase().includes(q);
    return byCat && byQuery;
  });
  renderProducts(state.filtered, els.menuGrid);
}

function buildOffers() {
  const offers = state.products.filter(
    (p) => p.salePrice > 0 && p.salePrice < p.price
  );
  els.offers.style.display = offers.length ? "block" : "none";
  if (offers.length) renderProducts(offers, els.offersGrid, true);
}

/* ===== رسم المنتجات ===== */
function renderProducts(list, mount) {
  mount.innerHTML = "";
  list.forEach((p) => {
    const hasOffer = p.salePrice > 0 && p.salePrice < p.price;
    const showPrice = p.price > 0;
    const priceHtml = hasOffer
      ? `<span class="old ltr-text">${priceFmt(
          p.price
        )}</span> <span class="new ltr-text">${priceFmt(p.salePrice)}</span>`
      : showPrice
      ? `<span class="ltr-text">${priceFmt(p.price)}</span>`
      : `<span class="coming-soon">اتصل للتسعير</span>`;

    const flags = (() => {
      if (p.sellMode === 1)
        return `<span class="flag"><i class="fa-solid fa-scale-balanced"></i> يباع بالكيلو</span>`;
      if (p.sellMode === 2)
        return `<span class="flag warn"><i class="fa-solid fa-drumstick-bite"></i> يباع كامل • السعر/كجم${
          p.approxKg ? ` • ~${p.approxKg}كجم/قطعة` : ""
        }</span>`;
      return "";
    })();

    const canAdd = showPrice;

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="image-wrap">
        ${hasOffer ? '<span class="badge-offer">عرض</span>' : ""}
        <img src="${p.image || placeholder}" alt="${p.name}">
      </div>
      <h3 class="product-name">${p.name}</h3>
      <p class="category">${p.category}</p>
      <div class="flags-row">${flags}</div>
      <p class="price">${priceHtml}</p>
      ${
        canAdd
          ? '<button class="add-btn" type="button"><i class="fa-solid fa-cart-plus"></i> أضف للسلة</button>'
          : '<button class="add-btn" type="button" disabled style="opacity:.6;cursor:not-allowed"><i class="fa-solid fa-circle-info"></i> غير متاح</button>'
      }
    `;
    if (canAdd) {
      card
        .querySelector(".add-btn")
        .addEventListener("click", () => openModal(p));
    }
    mount.appendChild(card);
  });
}

/* ===== المودال ===== */
function splitCuts(cutsStr) {
  return (cutsStr || "")
    .split(/[,،|\/\n]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function openModal(product) {
  state.modalProduct = product;

  els.modalImg.src = product.image || placeholder;
  els.modalName.textContent = product.name;
  els.modalCat.textContent = product.category;

  // التقطيع: خانة واحدة من CSV
  const cuts = splitCuts(product.cuts);
  if (cuts.length) {
    els.cutRow.style.display = "";
    els.cutSelect.innerHTML = cuts
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");
  } else {
    els.cutRow.style.display = "none";
    els.cutSelect.innerHTML = "";
  }

  // الكمية حسب وضع_البيع
  els.qtyInput.value = "1";
  let helper = "";
  if (product.sellMode === 1) {
    els.qtyInput.step = "0.1";
    els.qtyInput.setAttribute("inputmode", "decimal");
    helper = "سيتم حساب السعر حسب الكيلو.";
  } else if (product.sellMode === 2) {
    els.qtyInput.step = "1";
    els.qtyInput.setAttribute("inputmode", "numeric");
    helper = `هذا المنتج يُباع كاملًا والسعر الظاهر هو سعر الكيلو. ${
      product.approxKg
        ? `الوزن التقريبي للقطعة ~${product.approxKg} كجم. السعر النهائي بعد الوزن.`
        : "سيتم تحديد السعر النهائي بعد الوزن."
    }`;
  } else {
    els.qtyInput.step = "1";
    els.qtyInput.setAttribute("inputmode", "numeric");
    helper = "الكمية تحسب بالقطعة.";
  }

  // نص مساعد تحت خانة الكمية
  let helperEl = els.orderModal.querySelector(".qty-helper");
  if (!helperEl) {
    helperEl = document.createElement("div");
    helperEl.className = "qty-helper";
    els.qtyInput.closest(".qty").insertAdjacentElement("afterend", helperEl);
  }
  helperEl.textContent = helper;

  // ملاحظة
  els.noteInput.value = "";
  els.noteCount.textContent = "0";

  document.body.classList.add("modal-open");
  els.orderModal.classList.add("show");
  els.orderModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  els.orderModal.classList.remove("show");
  els.orderModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

els.qtyPlus?.addEventListener("click", () => {
  const p = state.modalProduct;
  const n = toNum(els.qtyInput.value, 1);
  const step = p?.sellMode === 1 ? 0.1 : 1;
  const next = n + step;
  els.qtyInput.value =
    p?.sellMode === 1
      ? String(Math.min(999, +next.toFixed(2)))
      : String(Math.min(999, Math.floor(next)));
});

els.qtyMinus?.addEventListener("click", () => {
  const p = state.modalProduct;
  const n = toNum(els.qtyInput.value, 1);
  const step = p?.sellMode === 1 ? 0.1 : 1;
  const next = n - step;
  els.qtyInput.value =
    p?.sellMode === 1
      ? String(Math.max(1, +next.toFixed(2)))
      : String(Math.max(1, Math.floor(next)));
});

els.noteInput?.addEventListener("input", () => {
  els.noteCount.textContent = els.noteInput.value.length;
});

els.modalCancel?.addEventListener("click", closeModal);
els.modalClose?.addEventListener("click", closeModal);
els.orderModal?.addEventListener("click", (e) => {
  if (e.target === els.orderModal || e.target.classList.contains("backdrop"))
    closeModal();
});

// ===== إضافة المنتج عند الضغط على Enter =====
els.orderModal?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    els.modalAdd?.click();
  }
});

els.modalAdd?.addEventListener("click", () => {
  if (!state.modalProduct) return;

  const p = state.modalProduct;
  const cut = els.cutSelect.value || "";
  let qty = toNum(els.qtyInput.value, 1);

  if (p.sellMode === 1)
    qty = Math.max(1, +qty.toFixed(2)); // بالكيلو يسمح بكسور
  else qty = Math.max(1, Math.floor(qty)); // قطعة/كامل: أعداد صحيحة

  const note = els.noteInput.value.trim();
  addToCart(p, qty, cut, note);
  closeModal();
  openCart();
});

/* ===== السلة ===== */
const CART_KEY = "elb_cart_v1";
function hydrateCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) state.cart = JSON.parse(raw);
  } catch {}
}
function persistCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  // عرّض السلة عالميًا لأي سكربت خارجي
  window.cart = state.cart;
}

function addToCart(product, qty, cut, note) {
  const idx = state.cart.findIndex(
    (x) => x.name === product.name && x.cut === cut
  );
  const unit =
    product.salePrice > 0 && product.salePrice < product.price
      ? product.salePrice
      : product.price;

  const base = {
    name: product.name,
    category: product.category,
    image: product.image || placeholder,
    price: unit,
    cut,
    note: note || "",
    qty,
    sellMode: product.sellMode,
    approxKg: product.approxKg || 0,
  };

  if (idx > -1) {
    state.cart[idx].qty += qty;
    if (note) state.cart[idx].note = note;
  } else {
    state.cart.push(base);
  }
  persistCart();
  updateCartUI();
}

function removeItem(i) {
  state.cart.splice(i, 1);
  persistCart();
  updateCartUI();
  if (!state.cart.length) closeCart();
}

function lineQtyText(it) {
  if (it.sellMode === 1) return `${(+it.qty).toFixed(2)} كجم`;
  if (it.sellMode === 2)
    return `${Math.floor(it.qty)} قطعة (يباع كامل • السعر/كجم${
      it.approxKg ? ` • ~${it.approxKg}كجم/قطعة` : ""
    })`;
  return `${Math.floor(it.qty)} قطعة`;
}

function linePriceText(it) {
  if (it.sellMode === 2) return `${priceFmt(it.price)} / كجم`;
  return priceFmt(it.price);
}

function qtyForMessage(it) {
  if (it.sellMode === 1) return `${formatQtyValue(it.qty)} كجم`;
  if (it.sellMode === 2) {
    const pcs = Math.max(1, Math.floor(+it.qty || 0));
    const approx = it.approxKg > 0 ? ` (~${it.approxKg} كجم/قطعة)` : "";
    return `${pcs} قطعة${approx}`;
  }
  return `${Math.max(1, Math.floor(+it.qty || 0))} عدد`;
}

function priceLabelForMessage(it) {
  return it.sellMode === 0 ? "سعر القطعة" : "سعر الكيلو";
}

function calcTotals() {
  let total = 0;
  let hasUnpriced = false;

  for (const x of state.cart) {
    if (x.sellMode === 2) {
      if (x.approxKg > 0) {
        total += x.price * x.approxKg * Math.max(1, Math.floor(x.qty));
      } else {
        hasUnpriced = true; // لا نضيف بدون وزن تقريبي
      }
    } else if (x.sellMode === 1) {
      total += x.price * (+x.qty || 0);
    } else {
      total += x.price * (Math.max(1, Math.floor(x.qty)) || 0);
    }
  }
  return { total, hasUnpriced };
}

function updateCartUI() {
  // عرّض السلة عالميًا (مهم لخطوة التأكيد)
  window.cart = state.cart;

  // عدّاد العناصر (يدعم الكسور في الكيلو)
  let count = 0;
  for (const x of state.cart) count += Number(x.qty) || 0;
  const countText = Number.isInteger(count)
    ? String(count)
    : String(+count.toFixed(2));
  const countEl = els.cartFab?.querySelector(".count");
  if (countEl) countEl.textContent = countText;

  // ✅ لو السلة فاضية: عطّل الزر
  if (!state.cart.length) {
    els.cartItems.innerHTML = `<p class="muted">السلة فارغة</p>`;
    els.cartTotal.textContent = priceFmt(0);
    if (els.goConfirm) els.goConfirm.disabled = true; // << هنا التعطيل
    updateWALink();
    return;
  }

  // رسم عناصر السلة
  els.cartItems.innerHTML = state.cart
    .map(
      (it, i) => `
      <div class="cart-row">
        <img src="${it.image}" alt="">
        <div>
          <div class="title">${it.name}</div>
          <div class="meta">${it.cut || "بدون تحديد"} • الكمية: ${lineQtyText(
        it
      )}</div>
          ${
            it.note
              ? `<div class="meta" style="color:#444">${it.note}</div>`
              : ""
          }
        </div>
        <div style="text-align:left">
          <div class="price ltr-text">${linePriceText(it)}</div>
          <button title="حذف" style="border:none;background:#f5f5f5;border-radius:8px;padding:6px 8px;cursor:pointer" data-rm="${i}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `
    )
    .join("");

  els.cartItems
    .querySelectorAll("[data-rm]")
    .forEach((b) =>
      b.addEventListener("click", () => removeItem(+b.dataset.rm))
    );

  // حساب الإجمالي
  const { total, hasUnpriced } = calcTotals();
  els.cartTotal.textContent = priceFmt(total);

  // ✅ بعد ما خلّصنا الرسم والحساب: فعِّل الزر
  if (els.goConfirm) els.goConfirm.disabled = false; // << ده المقصود بـ "بعد ما ترسم عناصر السلة"

  // ملاحظة توضيحية لو في أصناف كاملة بلا وزن تقريبي
  const footer = els.cartDrawer.querySelector(".drawer-footer");
  if (footer) {
    let note = footer.querySelector(".cart-note");
    if (!note) {
      note = document.createElement("div");
      note.className = "cart-note muted";
      note.style.cssText = "font-size:12px;margin-top:4px;";
      const confirmBtn = footer.querySelector("#goConfirm");
      footer.insertBefore(note, confirmBtn || footer.firstChild);
    }
    note.textContent = hasUnpriced
      ? "تنبيه: يوجد أصناف تُباع كاملة وسيتم تحديد سعرها النهائي بعد الوزن الفعلي."
      : "";
    note.style.display = hasUnpriced ? "block" : "none";
  }

  updateWALink();
}

/* ===== رسالة واتساب القديمة (اختياري لو الرابط لسه موجود) ===== */
function updateWALink() {
  if (!els.waCheckout) return; // لو اتشال اللينك من الـ HTML
  const lines = state.cart.map((item) => {
    const parts = [
      `• ${item.name}`,
      `      ${priceLabelForMessage(item)}: ${moneyTL(item.price)}`,
      `      الكمية: ${qtyForMessage(item)}`,
    ];
    if (item.cut) parts.push(`      طريقة التقطيع: ${item.cut}`);
    if (item.note) parts.push(`      ملاحظة: ${item.note}`);
    return parts.join("\n");
  });

  const { total, hasUnpriced } = calcTotals();
  const header = "طلب جديد من مزارع البركات 🌾🥩";
  const totalLine = `💰 الإجمالي التقريبي: ${moneyTL(total)}${
    hasUnpriced ? " (قد تتغير الأصناف الكاملة بعد الوزن)" : ""
  }`;
  const approxLine =
    "ℹ️ ملاحظة: الإجمالي تقريبي وقد يحدث فرق بسيط باختلاف الوزن.";

  const msgRaw = [
    header,
    "",
    "🧾 تفاصيل الطلب:",
    ...lines,
    "",
    totalLine,
    "",
    approxLine,
  ]
    .filter(Boolean)
    .join("\n");

  const encoded = encodeURIComponent(msgRaw);
  els.waCheckout.href = `https://wa.me/905524821848?text=${encoded}`;
}

/* فتح/إغلاق الدرج */
function openCart() {
  document.body.classList.add("drawer-open");
  els.cartDrawer.classList.add("open");
  els.drawerBackdrop.classList.add("show");
}
function closeCart() {
  els.cartDrawer.classList.remove("open");
  els.drawerBackdrop.classList.remove("show");
  document.body.classList.remove("drawer-open");
}
els.cartFab?.addEventListener("click", openCart);
els.drawerBackdrop?.addEventListener("click", closeCart);
els.drawerClose?.addEventListener("click", closeCart);

document.getElementById("cartClear")?.addEventListener("click", () => {
  state.cart = [];
  persistCart();
  updateCartUI();
  closeCart();
});

/* ===== زر تأكيد الطلب ➜ confirm.html ===== */
(function setupConfirmButton() {
  if (!els.goConfirm) return; // لو لسه ما غيرتش زرار الواتساب في HTML
  const BRAND_NAME = "مزارع البركات";
  const WA_NUMBER = "905524821848"; // بدون +

  els.goConfirm.addEventListener("click", () => {
    if (!state.cart.length) {
      alert("السلة فارغة");
      return;
    }

    // جهّز عناصر للـ confirm.html
    const items = state.cart.map((x) => {
      // الوحدة: بالكيلو/كامل (السعر/كجم)/قطعة
      let unit = "قطعة";
      if (x.sellMode === 1) unit = "كجم";
      else if (x.sellMode === 2) unit = "كجم"; // السعر/كجم لكن الكمية قطع

      // الكمية تُحترم كما هي (قد تكون كسر للكيلو)
      const qty = Number(x.qty) || 0;

      // السعر: رقم فقط بدون رمز
      const price = Number(x.price) || 0;

      return {
        name: x.name,
        qty,
        unit,
        price,
        cut: x.cut || "",
        note: x.note || "",
        sellMode: x.sellMode,
        approxKg: x.approxKg || 0,
      };
    });

    // إجمالي تقريبي بنفس منطق السلة
    const { total } = calcTotals();

    const draft = {
      items,
      total: Number(total || 0),
      brand: BRAND_NAME,
      waNumber: WA_NUMBER,
    };

    try {
      localStorage.setItem("orderDraft", JSON.stringify(draft));
    } catch (e) {
      console.error("orderDraft save error:", e);
    }

    // تحوّل لصفحة التأكيد
    window.location.href = "conformation.html";
  });
})();

function setupScrollTop() {
  const btn = els.scrollTop;
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
}

setupFilterArrows();
setupScrollTop();
