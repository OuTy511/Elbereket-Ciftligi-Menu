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

const getLangCode = () => {
  const api = getI18n();
  return typeof api.getLang === "function" ? api.getLang() : "ar";
};

const makeRecord = (arValue, trValue) => {
  const ar = (arValue || "").trim();
  const tr = (trValue || "").trim();
  if (!ar && !tr) return { ar: "", tr: "" };
  return { ar: ar || tr, tr: tr || ar };
};

const ensureRecord = (value, fallback = "") => {
  if (!value && fallback) return ensureRecord(fallback);
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return { ar: "", tr: "" };
    return { ar: text, tr: text };
  }
  if (value && typeof value === "object") {
    const ar = (value.ar || value.Ar || "").trim();
    const tr = (value.tr || value.Tr || "").trim();
    if (!ar && !tr) {
      const fb = (fallback || "").trim();
      return fb ? { ar: fb, tr: fb } : { ar: "", tr: "" };
    }
    return { ar: ar || tr, tr: tr || ar };
  }
  const fb = (fallback || "").trim();
  return fb ? { ar: fb, tr: fb } : { ar: "", tr: "" };
};

const labelFor = (value, lang = getLangCode()) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = ensureRecord(value);
  return record[lang] || record.ar || record.tr || "";
};

const splitValues = (raw = "") =>
  raw
    .split(/[,،|\/\n]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

const buildCutOptions = (arStr, trStr) => {
  const arList = splitValues(arStr);
  const trList = splitValues(trStr);
  const len = Math.max(arList.length, trList.length);
  const cuts = [];
  for (let i = 0; i < len; i += 1) {
    const record = makeRecord(arList[i], trList[i]);
    if (!record.ar && !record.tr) continue;
    cuts.push({ id: String(i), names: record });
  }
  return cuts;
};

const getCategoryId = (category) => {
  if (!category) return "";
  if (typeof category === "string") return category;
  return category.id || "";
};

const recordMatchesQuery = (record, queryAr, queryTr) => {
  if (!record) return false;
  const rec = ensureRecord(record);
  const arText = (rec.ar || "").toLowerCase();
  const trText = (rec.tr || "").toLocaleLowerCase("tr-TR");
  return (
    (queryAr && arText.includes(queryAr)) ||
    (queryTr && trText.includes(queryTr))
  );
};

const ALL_CATEGORY = "__ALL__";

const translateCategoryKey = (value) => {
  if (!value) return "";
  const key = `menu.categories.${value}`;
  const label = t(key);
  return label === key ? "" : label;
};

const translateCategory = (...candidates) => {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const label = translateCategoryKey(candidate);
    if (label) return label;
  }
  return "";
};

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
  offersPrev: document.querySelector("[data-offers-prev]"),
  offersNext: document.querySelector("[data-offers-next]"),
  offersViewport: document.querySelector("[data-offers-viewport]"),
  offersDots: document.getElementById("offersDots"),
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

const offersCarousel = (() => {
  const AUTO_DELAY = 2000;
  let items = [];
  let activeIndex = 0;
  let timer = null;
  let currentOffset = 0;

  const computeDirection = (from, to, total) => {
    if (from === to || !total) return 0;
    const forward = (to - from + total) % total;
    const backward = (from - to + total) % total;
    return forward <= backward ? 1 : -1;
  };

  const markAnimating = () => {
    const grid = els.offersGrid;
    if (!grid) return;
    grid.classList.add("is-sliding");
    const handle = (event) => {
      if (event.target !== grid || event.propertyName !== "transform") return;
      grid.classList.remove("is-sliding");
      grid.removeEventListener("transitionend", handle);
    };
    grid.addEventListener("transitionend", handle);
  };

  const stopAuto = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const updateDotsState = () => {
    if (!els.offersDots) return;
    const dots = els.offersDots.querySelectorAll(".offers-dot");
    dots.forEach((dot, idx) => {
      const isActive = idx === activeIndex;
      dot.classList.toggle("active", isActive);
      dot.setAttribute("aria-selected", isActive ? "true" : "false");
      dot.setAttribute("tabindex", isActive ? "0" : "-1");
    });
  };

  const applyTransform = (offset, instant = false) => {
    if (!els.offersGrid) return;
    if (instant) {
      const prevTransition = els.offersGrid.style.transition;
      els.offersGrid.style.transition = "none";
      els.offersGrid.style.transform = `translate3d(${-offset}px, 0, 0)`;
      void els.offersGrid.offsetWidth;
      requestAnimationFrame(() => {
        if (els.offersGrid) els.offersGrid.style.transition = prevTransition || "";
      });
      currentOffset = offset;
      return;
    }
    if (offset === currentOffset) return;
    markAnimating();
    els.offersGrid.style.transform = `translate3d(${-offset}px, 0, 0)`;
    currentOffset = offset;
  };

  const goTo = (idx, opts = {}) => {
    if (!items.length) return;
    const { instant = false } = opts;
    const total = items.length;
    const prevIndex = activeIndex;
    activeIndex = ((idx % total) + total) % total;
    const direction = instant ? 0 : computeDirection(prevIndex, activeIndex, total);
    const target = items[activeIndex];
    const base = items[0]?.offsetLeft ?? 0;
    const offset = target ? target.offsetLeft - base : 0;
    applyTransform(offset, instant);
    updateDotsState();
    items.forEach((item, itemIdx) => {
      item.classList.remove("is-entering-forward", "is-entering-backward");
      item.classList.toggle("is-active", itemIdx === activeIndex);
    });
    const activeItem = items[activeIndex];
    if (activeItem) {
      void activeItem.offsetWidth;
      if (direction !== 0) {
        activeItem.classList.add(
          direction > 0 ? "is-entering-forward" : "is-entering-backward"
        );
      }
    }
  };

  const startAuto = () => {
    stopAuto();
    if (items.length <= 1) return;
    timer = setInterval(() => {
      goTo(activeIndex + 1);
    }, AUTO_DELAY);
  };

  const rebuildDots = () => {
    if (!els.offersDots) return;
    els.offersDots.innerHTML = "";
    if (items.length <= 1) {
      els.offersDots.style.display = "none";
      return;
    }
    els.offersDots.style.display = "";
    items.forEach((_, idx) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "offers-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `${idx + 1}`);
      dot.setAttribute("aria-selected", "false");
      dot.setAttribute("tabindex", "-1");
      dot.addEventListener("click", () => {
        goTo(idx);
        startAuto();
      });
      els.offersDots.appendChild(dot);
    });
    updateDotsState();
  };

  const toggleControls = (show) => {
    const display = show ? "" : "none";
    if (els.offersPrev) {
      els.offersPrev.style.display = display;
      els.offersPrev.disabled = !show;
    }
    if (els.offersNext) {
      els.offersNext.style.display = display;
      els.offersNext.disabled = !show;
    }
  };

  const update = () => {
    stopAuto();
    if (!els.offersGrid) return;
    items = Array.from(els.offersGrid.children || []);
    items.forEach((item) => item.classList.remove("is-active"));
    activeIndex = 0;
    toggleControls(items.length > 1);
    rebuildDots();
    if (!items.length) {
      applyTransform(0, true);
      return;
    }
    requestAnimationFrame(() => {
      goTo(0, { instant: true });
      startAuto();
    });
  };

  const prevHandler = () => {
    if (!items.length) return;
    goTo(activeIndex - 1);
    startAuto();
  };

  const nextHandler = () => {
    if (!items.length) return;
    goTo(activeIndex + 1);
    startAuto();
  };

  els.offersPrev?.addEventListener("click", prevHandler);
  els.offersNext?.addEventListener("click", nextHandler);

  const attachPauseHandlers = (el) => {
    if (!el) return;
    el.addEventListener("mouseenter", stopAuto);
    el.addEventListener("mouseleave", startAuto);
    el.addEventListener("focusin", stopAuto);
    el.addEventListener("focusout", (event) => {
      const nextTarget = event.relatedTarget;
      if (!nextTarget || !el.contains(nextTarget)) startAuto();
    });
  };

  if (els.offersViewport) {
    attachPauseHandlers(els.offersViewport);
  }

  attachPauseHandlers(els.offersPrev);
  attachPauseHandlers(els.offersNext);
  attachPauseHandlers(els.offersDots);

  window.addEventListener("resize", () => {
    if (!items.length) return;
    goTo(activeIndex, { instant: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });

  return { update };
})();

bindNumericInput(els.qtyInput, {
  allowDecimal: () => state.modalProduct?.sellMode === 1,
});

const parseProductRow = (row, idx) => {
  const nameAr = (row["الاسم_عربي"] || row["الاسم"] || "").trim();
  const nameTr = (row["الاسم_تركي"] || "").trim();
  const categoryAr = (row["القسم_عربي"] || row["القسم"] || "").trim();
  const categoryTr = (row["القسم_تركي"] || "").trim();
  if (!nameAr && !nameTr) return null;
  if (!categoryAr && !categoryTr) return null;

  const categoryId = categoryAr || categoryTr || `category-${idx}`;
  const nameBase = nameAr || nameTr || `item-${idx}`;
  const safeName = nameBase.replace(/\s+/g, "-");
  const productId = `${idx}-${safeName}`;

  const cutsAr = row["خيارات_التقطيع_عربي"] || row["خيارات_التقطيع"] || "";
  const cutsTr = row["خيارات_التقطيع_تركي"] || "";

  return {
    id: productId,
    names: makeRecord(nameAr, nameTr),
    category: {
      id: categoryId,
      names: makeRecord(categoryAr || categoryId, categoryTr),
    },
    price: toNum(row["السعر"], 0),
    salePrice: toNum(row["سعر_الخصم"], 0),
    cuts: buildCutOptions(cutsAr, cutsTr),
    image: (row["الصورة"] || "").trim(),
    sellMode: Number((row["وضع_البيع"] || "0").trim()) || 0,
    approxKg: toNum(row["وزن_تقريبي_كجم"], 0),
  };
};

/* ===== تحميل CSV ===== */
if (window.Papa) {
  Papa.parse(CSV_PATH, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: ({ data }) => {
      state.products = data
        .map((row, idx) => parseProductRow(row, idx))
        .filter(Boolean);

      const categoryMap = new Map();
      state.products.forEach((p) => {
        if (!p?.category) return;
        const id = getCategoryId(p.category);
        if (!id || categoryMap.has(id)) return;
        categoryMap.set(id, {
          id,
          names: ensureRecord(p.category.names || p.category, id),
        });
      });
      state.categories = Array.from(categoryMap.values());
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
  if (!category) return "";
  if (category === ALL_CATEGORY) return t("menu.filters.all");

  if (typeof category === "string") {
    return translateCategory(category) || category;
  }

  const id = getCategoryId(category);
  const record = ensureRecord(category.names || category, id);
  const direct = labelFor(record);

  const hasDistinctTranslations =
    record.ar && record.tr && record.ar !== record.tr;
  if (hasDistinctTranslations && direct) return direct;

  const translated = translateCategory(id, record.ar, record.tr);
  if (translated) return translated;

  if (direct) return direct;
  return id || "";
};

/* ===== الفلاتر والبحث ===== */
function buildFilters() {
  if (!els.categoryFilters) return;
  els.categoryFilters.innerHTML = "";
  const entries = [
    { id: ALL_CATEGORY, label: t("menu.filters.all") },
    ...state.categories.map((cat) => {
      const id = getCategoryId(cat);
      return {
        id,
        label: getCategoryLabel(cat) || id,
      };
    }),
  ].filter((item) => item.id);

  entries.forEach(({ id, label }) => {
    const b = document.createElement("button");
    b.className =
      "filter-btn" + (id === state.activeCategory ? " active" : "");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("click", () => {
      state.activeCategory = id;
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
  const rawQuery = state.query.trim();
  const queryAr = rawQuery.toLowerCase();
  const queryTr = rawQuery.toLocaleLowerCase("tr-TR");
  const hasQuery = rawQuery.length > 0;

  state.filtered = state.products.filter((p) => {
    const catId = getCategoryId(p.category);
    const byCat =
      state.activeCategory === ALL_CATEGORY || catId === state.activeCategory;
    if (!byCat) return false;
    if (!hasQuery) return true;
    return (
      recordMatchesQuery(p.names, queryAr, queryTr) ||
      recordMatchesQuery(p.category?.names, queryAr, queryTr)
    );
  });
  renderProducts(state.filtered, els.menuGrid);
}

function buildOffers() {
  const offers = state.products.filter(
    (p) => p.salePrice > 0 && p.salePrice < p.price
  );
  els.offers.style.display = offers.length ? "block" : "none";
  if (offers.length) renderProducts(offers, els.offersGrid, true);
  else if (els.offersGrid) els.offersGrid.innerHTML = "";
  offersCarousel.update();
}

/* ===== رسم المنتجات ===== */
function renderProducts(list, mount) {
  mount.innerHTML = "";
  list.forEach((p) => {
    const hasOffer = p.salePrice > 0 && p.salePrice < p.price;
    const showPrice = p.price > 0;
    const productName = labelFor(p.names);
    const categoryLabel = getCategoryLabel(p.category);
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

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="image-wrap">
        ${hasOffer ? `<span class="badge-offer">${t("menu.badge.offer")}</span>` : ""}
        <img src="${p.image || placeholder}" alt="${productName}">
      </div>
      <h3 class="product-name">${productName}</h3>
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
  if (options && options.length) {
    Array.from(options).forEach((opt) => {
      if (opt.value === "") {
        opt.textContent = t("menu.modal.cutPlaceholder");
        return;
      }
      const cut = product.cuts?.find((c) => c.id === opt.value);
      if (cut) opt.textContent = labelFor(cut.names);
    });
  }
  const helperEl = els.orderModal?.querySelector(".qty-helper");
  if (helperEl) helperEl.textContent = getHelperText(product);
}

function openModal(product) {
  state.modalProduct = product;

  els.modalImg.src = product.image || placeholder;
  els.modalName.textContent = labelFor(product.names);
  els.modalCat.textContent = getCategoryLabel(product.category);

  const cuts = Array.isArray(product.cuts) ? product.cuts : [];
  if (cuts.length) {
    els.cutRow.style.display = "";
    const options = [
      `<option value="" disabled selected>${t("menu.modal.cutPlaceholder")}</option>`,
      ...cuts.map((c) => `<option value="${c.id}">${labelFor(c.names)}</option>`),
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
  const cuts = Array.isArray(p.cuts) ? p.cuts : [];
  const requiresCut = cuts.length > 0;
  const cutId = (els.cutSelect.value || "").trim();
  if (requiresCut && !cutId) {
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
  addToCart(p, qty, cutId, note);
  closeModal();
  openCart();
});

/* ===== السلة ===== */
const CART_KEY = "elb_cart_v1";

function normalizeCartItem(item, idx = 0) {
  if (!item) return null;
  const nameRecord = ensureRecord(
    item.name,
    item.nameAr || item.nameTr || item.legacyName || item.name || ""
  );
  const categorySource =
    (item.category && typeof item.category === "object" && item.category.names)
      ? item.category.names
      : item.category;
  const categoryId =
    (item.category && typeof item.category === "object" && item.category.id) ||
    item.categoryId ||
    (typeof item.category === "string" ? item.category : "");
  const categoryRecord = ensureRecord(categorySource, categoryId);
  const cutRecord = item.cut ? ensureRecord(item.cut) : null;
  const cutId = item.cutId || item.cutOptionId || "";
  const fallbackName = nameRecord.ar || nameRecord.tr || `item-${idx}`;
  const fallbackCat = categoryId || "category";
  const productId =
    item.productId ||
    item.id ||
    `${fallbackCat}__${fallbackName}`.replace(/\s+/g, "_");

  return {
    ...item,
    productId,
    name: nameRecord,
    category: { id: categoryId, names: categoryRecord },
    categoryId,
    image: item.image || placeholder,
    price: Number(item.price) || 0,
    cutId: cutId || (cutRecord ? cutRecord.ar || cutRecord.tr || "" : ""),
    cut: cutRecord,
    note: item.note || "",
    qty: Number(item.qty) || 0,
    sellMode: Number(item.sellMode) || 0,
    approxKg: toNum(item.approxKg, 0),
    legacyName: nameRecord.ar || nameRecord.tr || "",
    legacyCategory: categoryRecord.ar || categoryRecord.tr || "",
    cutText: cutRecord ? cutRecord.ar || cutRecord.tr || "" : "",
  };
}

function hydrateCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    state.cart = Array.isArray(parsed)
      ? parsed.map((item, idx) => normalizeCartItem(item, idx)).filter(Boolean)
      : [];
  } catch {
    state.cart = [];
  }
}
function persistCart() {
  state.cart = state.cart.map((item, idx) => normalizeCartItem(item, idx)).filter(Boolean);
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  // عرّض السلة عالميًا لأي سكربت خارجي
  window.cart = state.cart;
}

function addToCart(product, qty, cutId, note) {
  const cuts = Array.isArray(product.cuts) ? product.cuts : [];
  const cutOption = cutId ? cuts.find((c) => c.id === cutId) : null;
  const unit =
    product.salePrice > 0 && product.salePrice < product.price
      ? product.salePrice
      : product.price;

  const base = {
    productId: product.id,
    name: product.names,
    category: product.category,
    categoryId: product.category?.id || "",
    image: product.image || placeholder,
    price: unit,
    cutId: cutOption?.id || "",
    cut: cutOption ? cutOption.names : null,
    note: note || "",
    qty,
    sellMode: product.sellMode,
    approxKg: product.approxKg || 0,
  };

  const normalized = normalizeCartItem(base, state.cart.length);
  const idx = state.cart.findIndex(
    (x) =>
      x.productId === normalized.productId &&
      (x.cutId || "") === (normalized.cutId || "")
  );

  if (idx > -1) {
    const existing = normalizeCartItem(state.cart[idx], idx);
    existing.qty = Number(existing.qty || 0) + qty;
    if (note) existing.note = note;
    existing.price = normalized.price;
    existing.sellMode = normalized.sellMode;
    existing.approxKg = normalized.approxKg;
    existing.image = normalized.image;
    existing.cut = normalized.cut;
    existing.cutId = normalized.cutId;
    existing.category = normalized.category;
    existing.categoryId = normalized.categoryId;
    existing.name = normalized.name;
    state.cart[idx] = existing;
  } else {
    state.cart.push(normalized);
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
      const nameText = labelFor(it.name);
      const cutText = it.cut ? labelFor(it.cut) : t("menu.cart.meta.none");
      const qtyLabel = t("menu.cart.meta.quantity");
      const noteLabel = t("menu.cart.meta.note");
      const deleteLabel = t("menu.cart.meta.delete");
      return `
      <div class="cart-row">
        <img src="${it.image}" alt="${nameText}">
        <div>
          <div class="title">${nameText}</div>
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
    const nameText = labelFor(item.name);
    const parts = [
      `• ${nameText}`,
      `      ${priceLabelForMessage(item)}: ${moneyTL(item.price)}`,
      `      ${t("menu.whatsapp.quantity")}: ${qtyForMessage(item)}`,
    ];
    const cutText = item.cut ? labelFor(item.cut) : "";
    if (cutText)
      parts.push(`      ${t("menu.whatsapp.cut")}: ${cutText}`);
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
    const items = state.cart.map((x, idx) => {
      // الوحدة: بالكيلو/كامل (السعر/كجم)/قطعة
      let unit = "piece";
      if (x.sellMode === 1) unit = "kg";
      else if (x.sellMode === 2) unit = "kg"; // السعر/كجم لكن الكمية قطع

      // الكمية تُحترم كما هي (قد تكون كسر للكيلو)
      const qty = Number(x.qty) || 0;

      // السعر: رقم فقط بدون رمز
      const price = Number(x.price) || 0;

      const nameRecord = ensureRecord(x.name);
      const categoryRecord = ensureRecord(
        (x.category && x.category.names) || x.category,
        x.categoryId || ""
      );
      const cutRecord = x.cut ? ensureRecord(x.cut) : null;
      const productId =
        x.productId ||
        `${x.categoryId || "cat"}__${nameRecord.ar || nameRecord.tr || idx}`;

      return {
        productId,
        name: nameRecord,
        category: {
          id: x.categoryId || (x.category && x.category.id) || "",
          names: categoryRecord,
        },
        image: x.image || "",
        qty,
        unit,
        price,
        cut: cutRecord,
        note: x.note || "",
        sellMode: x.sellMode,
        approxKg: x.approxKg || 0,
        legacyName: nameRecord.ar || nameRecord.tr || "",
        legacyCategory: categoryRecord.ar || categoryRecord.tr || "",
        cutText: cutRecord ? cutRecord.ar || cutRecord.tr || "" : "",
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

onLangChange(() => {
  buildFilters();
  applyFilters();
  buildOffers();
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
