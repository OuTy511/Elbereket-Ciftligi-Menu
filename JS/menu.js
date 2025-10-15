const i18nApi = window.i18n || {
  t: (key) => key,
  onChange: () => () => {},
};

const t = (key, params) =>
  typeof i18nApi.t === "function" ? i18nApi.t(key, params) : key;

const ALL_CATEGORY = "__ALL__";

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
  if (value == null) return "";
  const normalized = normalizeDigits(value)
    .replace(/[\u066C\s\u00A0]/g, "") // remove Arabic thousands separator & spaces
    .replace(/[\u060C\u061B]/g, "") // remove Arabic comma/semicolon
    .replace(/\u066B/g, "."); // Arabic decimal separator

  if (!allowDecimal)
    return normalized.replace(/[.,٫٬،]/g, "").replace(/[^0-9]/g, "");

  const prepared = normalized
    .replace(/[٫٬،]/g, ".")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");
  const [lead, ...rest] = prepared.split(".");
  return lead + (rest.length ? "." + rest.join("") : "");
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
  activeCategory: ALL_CATEGORY,
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
        ALL_CATEGORY,
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
      els.menuGrid.innerHTML = `<p class="muted">${t(
        "menu.alert.loadFail"
      )}</p>`;
    },
  });
} else {
  els.menuGrid.innerHTML = `<p class="muted">${t(
    "menu.alert.noPapa"
  )}</p>`;
}

const getCategoryLabel = (category) => {
  if (category === ALL_CATEGORY) return t("menu.filters.all");
  const key = `menu.categories.${category}`;
  const label = t(key);
  return label === key ? category : label;
};

/* ===== الفلاتر والبحث ===== */
function buildFilters() {
  els.categoryFilters.innerHTML = "";
  state.categories.forEach((cat) => {
    const b = document.createElement("button");
    b.className =
      "filter-btn" + (cat === state.activeCategory ? " active" : "");
    b.type = "button";
    b.textContent = getCategoryLabel(cat);
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

  if (els.searchInput && !els.searchInput.dataset.bound) {
    let qTimer;
    els.searchInput.addEventListener("input", () => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => {
        state.query = els.searchInput.value.trim();
        applyFilters();
      }, 200);
    });
    els.searchInput.dataset.bound = "1";
  }
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
      state.activeCategory === ALL_CATEGORY || p.category === state.activeCategory;
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
      : `<span class="coming-soon">${t("menu.product.callForPrice")}</span>`;

    const flags = (() => {
      if (p.sellMode === 1)
        return `<span class="flag"><i class="fa-solid fa-scale-balanced"></i> ${t(
          "menu.flags.sellByKg"
        )}</span>`;
      if (p.sellMode === 2) {
        const approx = p.approxKg
          ? t("menu.flags.sellWholeApprox", { kg: formatQtyValue(p.approxKg) })
          : "";
        return `<span class="flag warn"><i class="fa-solid fa-drumstick-bite"></i> ${t(
          "menu.flags.sellWhole"
        )}${approx}</span>`;
      }
      return "";
    })();

    const canAdd = showPrice;
    const addLabel = t("common.actions.addToCart");
    const unavailableLabel = t("menu.product.unavailable");
    const categoryLabel = getCategoryLabel(p.category);

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="image-wrap">
        ${hasOffer ? `<span class="badge-offer">${t("menu.badge.offer")}</span>` : ""}
        <img src="${p.image || placeholder}" alt="${p.name}">
      </div>
      <h3 class="product-name">${p.name}</h3>
      <p class="category">${categoryLabel}</p>
      <div class="flags-row">${flags}</div>
      <p class="price">${priceHtml}</p>
      ${
        canAdd
          ? `<button class="add-btn" type="button"><i class="fa-solid fa-cart-plus"></i> ${addLabel}</button>`
          : `<button class="add-btn" type="button" disabled style="opacity:.6;cursor:not-allowed"><i class="fa-solid fa-circle-info"></i> ${unavailableLabel}</button>`
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

function getHelperText(product) {
  if (!product) return "";
  if (product.sellMode === 1) return t("menu.modal.helper.sellByKg");
  if (product.sellMode === 2) {
    const approxText = product.approxKg
      ? t("menu.modal.helper.sellWhole.withApprox", {
          kg: formatQtyValue(product.approxKg),
        })
      : t("menu.modal.helper.sellWhole.noApprox");
    return t("menu.modal.helper.sellWhole", { text: approxText });
  }
  return t("menu.modal.helper.sellPiece");
}

function refreshModalLanguage() {
  const product = state.modalProduct;
  if (!product) return;
  const options = els.cutSelect?.options;
  if (options && options.length && options[0].value === "") {
    options[0].textContent = t("menu.modal.cutPlaceholder");
  }
  const helperEl = els.orderModal?.querySelector(".qty-helper");
  if (helperEl) helperEl.textContent = getHelperText(product);
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
    const options = [
      `<option value="" disabled selected>${t("menu.modal.cutPlaceholder")}</option>`,
      ...cuts.map((c) => `<option value="${c}">${c}</option>`),
    ];
    els.cutSelect.innerHTML = options.join("");
    els.cutSelect.value = "";
    els.cutSelect.classList.remove("invalid");
  } else {
    els.cutRow.style.display = "none";
    els.cutSelect.innerHTML = "";
  }

  // الكمية حسب وضع_البيع
  els.qtyInput.value = "1";
  if (product.sellMode === 1) {
    els.qtyInput.step = "0.1";
    els.qtyInput.inputMode = "decimal";
    els.qtyInput.setAttribute("inputmode", "decimal");
  } else if (product.sellMode === 2) {
    els.qtyInput.step = "1";
    els.qtyInput.inputMode = "numeric";
    els.qtyInput.setAttribute("inputmode", "numeric");
  } else {
    els.qtyInput.step = "1";
    els.qtyInput.inputMode = "numeric";
    els.qtyInput.setAttribute("inputmode", "numeric");
  }

  // نص مساعد تحت خانة الكمية
  let helperEl = els.orderModal.querySelector(".qty-helper");
  if (!helperEl) {
    helperEl = document.createElement("div");
    helperEl.className = "qty-helper";
    els.qtyInput.closest(".qty").insertAdjacentElement("afterend", helperEl);
  }
  helperEl.textContent = getHelperText(product);

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

els.cutSelect?.addEventListener("change", () => {
  els.cutSelect.classList.remove("invalid");
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
  const requiresCut = splitCuts(p.cuts).length > 0;
  const cut = (els.cutSelect.value || "").trim();
  if (requiresCut && !cut) {
    els.cutSelect.classList.add("invalid");
    els.cutSelect.focus();
    alert(t("menu.modal.cutError"));
    return;
  }
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
    state.cart = raw ? JSON.parse(raw) : [];
  } catch {
    state.cart = [];
  }
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
  if (it.sellMode === 1) {
    return `${formatQtyValue(it.qty)} ${t("menu.units.kg")}`;
  }
  if (it.sellMode === 2) {
    const pieces = Math.max(1, Math.floor(it.qty));
    const approx = it.approxKg
      ? t("menu.flags.sellWholeApprox", { kg: formatQtyValue(it.approxKg) })
      : "";
    return `${pieces} ${t("menu.units.piecePlural")} (${t(
      "menu.flags.sellWhole"
    )}${approx})`;
  }
  return `${Math.max(1, Math.floor(it.qty))} ${t("menu.units.piecePlural")}`;
}

function linePriceText(it) {
  if (it.sellMode === 2) return `${priceFmt(it.price)} / ${t("menu.units.kg")}`;
  return priceFmt(it.price);
}

function qtyForMessage(it) {
  if (it.sellMode === 1) {
    return `${formatQtyValue(it.qty)} ${t("menu.units.kg")}`;
  }
  if (it.sellMode === 2) {
    const pcs = Math.max(1, Math.floor(+it.qty || 0));
    const approx =
      it.approxKg > 0
        ? t("menu.units.approxPieceKg", { kg: formatQtyValue(it.approxKg) })
        : "";
    return `${pcs} ${t("menu.units.piecePlural")}${approx}`;
  }
  return `${Math.max(1, Math.floor(+it.qty || 0))} ${t("menu.units.count")}`;
}

function priceLabelForMessage(it) {
  return it.sellMode === 0
    ? t("menu.price.unitPiece")
    : t("menu.price.unitKg");
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
    els.cartItems.innerHTML = `<p class="muted">${t("menu.cart.empty")}</p>`;
    els.cartTotal.textContent = priceFmt(0);
    if (els.goConfirm) els.goConfirm.disabled = true; // << هنا التعطيل
    updateWALink();
    return;
  }

  // رسم عناصر السلة
  els.cartItems.innerHTML = state.cart
    .map((it, i) => {
      const cutText = it.cut || t("menu.cart.meta.none");
      const qtyLabel = t("menu.cart.meta.quantity");
      const noteLabel = t("menu.cart.meta.note");
      const deleteLabel = t("menu.cart.meta.delete");
      return `
      <div class="cart-row">
        <img src="${it.image}" alt="">
        <div>
          <div class="title">${it.name}</div>
          <div class="meta">${cutText} • ${qtyLabel}: ${lineQtyText(it)}</div>
          ${
            it.note
              ? `<div class="meta" style="color:#444">${noteLabel}: ${it.note}</div>`
              : ""
          }
        </div>
        <div style="text-align:left">
          <div class="price ltr-text">${linePriceText(it)}</div>
          <button title="${deleteLabel}" style="border:none;background:#f5f5f5;border-radius:8px;padding:6px 8px;cursor:pointer" data-rm="${i}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    })
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
    note.textContent = hasUnpriced ? t("common.note.unpriced") : "";
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
      `      ${t("menu.whatsapp.quantity")}: ${qtyForMessage(item)}`,
    ];
    if (item.cut)
      parts.push(`      ${t("menu.whatsapp.cut")}: ${item.cut}`);
    if (item.note)
      parts.push(`      ${t("menu.whatsapp.noteLabel")}: ${item.note}`);
    return parts.join("\n");
  });

  const { total, hasUnpriced } = calcTotals();
  const header = t("menu.whatsapp.header", { brand: t("common.brandName") });
  const totalLine = `${t("menu.whatsapp.total", {
    total: moneyTL(total),
  })}${hasUnpriced ? t("menu.whatsapp.totalChange") : ""}`;
  const approxLine = t("menu.whatsapp.note");
  const detailsLabel = t("menu.whatsapp.details");

  const msgRaw = [
    header,
    "",
    detailsLabel,
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
  const BRAND_NAME = t("common.brandName");
  const WA_NUMBER = "905524821848"; // بدون +

  els.goConfirm.addEventListener("click", () => {
    if (!state.cart.length) {
      alert(t("menu.alert.cartEmpty"));
      return;
    }

    // جهّز عناصر للـ confirm.html
    const items = state.cart.map((x) => {
      // الوحدة: بالكيلو/كامل (السعر/كجم)/قطعة
      let unit = "piece";
      if (x.sellMode === 1) unit = "kg";
      else if (x.sellMode === 2) unit = "kg"; // السعر/كجم لكن الكمية قطع

      // الكمية تُحترم كما هي (قد تكون كسر للكيلو)
      const qty = Number(x.qty) || 0;

      // السعر: رقم فقط بدون رمز
      const price = Number(x.price) || 0;

      return {
        name: x.name,
        category: x.category || "",
        image: x.image || "",
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

i18nApi.onChange(() => {
  buildFilters();
  applyFilters();
  updateCartUI();
  updateWALink();
  refreshModalLanguage();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  hydrateCart();
  updateCartUI();
});

window.addEventListener("storage", (evt) => {
  if (evt.key && evt.key !== CART_KEY) return;
  hydrateCart();
  updateCartUI();
});
