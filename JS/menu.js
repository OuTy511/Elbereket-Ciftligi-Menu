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
const toNum = (v, def = 0) => {
  if (v == null) return def;
  const s = String(v)
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? def : n;
};

/* ===== عناصر الصفحة ===== */
const els = {
  categoryFilters: document.getElementById("categoryFilters"),
  searchInput: document.getElementById("searchInput"),
  offers: document.getElementById("offers"),
  offersGrid: document.getElementById("offersGrid"),
  menuGrid: document.getElementById("menuGrid"),

  cartFab: document.getElementById("cartFab"),
  cartDrawer: document.getElementById("cartDrawer"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  drawerClose: document.querySelector(".drawer-close"),
  cartItems: document.getElementById("cartItems"),
  cartTotal: document.getElementById("cartTotal"),
  waCheckout: document.getElementById("waCheckout"),

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
          cuts: (r["خيارات_التقطيع"] || "").trim(), // خانة واحدة فقط
          image: (r["الصورة"] || "").trim(),
          sellMode: Number((r["وضع_البيع"] || "0").trim()) || 0, // 0 قطعة / 1 كجم / 2 كامل+سعر/كجم
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
  });
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

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value.trim();
    applyFilters();
  });
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeCart();
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
  if (it.sellMode === 1)
    return `${(+it.qty).toFixed(2).replace(/[^\d.]/g, "")} كجم`;
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
  // عدّاد العناصر (يدعم الكسور في الكيلو)
  let count = 0;
  for (const x of state.cart) count += Number(x.qty) || 0;
  const countText = Number.isInteger(count)
    ? String(count)
    : String(+count.toFixed(2));
  const countEl = els.cartFab?.querySelector(".count");
  if (countEl) countEl.textContent = countText;

  if (!state.cart.length) {
    els.cartItems.innerHTML = `<p class="muted">السلة فارغة</p>`;
    els.cartTotal.textContent = priceFmt(0);
    updateWALink();
    return;
  }

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
      </div>`
    )
    .join("");

  els.cartItems
    .querySelectorAll("[data-rm]")
    .forEach((b) =>
      b.addEventListener("click", () => removeItem(+b.dataset.rm))
    );

  const { total, hasUnpriced } = calcTotals();
  els.cartTotal.textContent = priceFmt(total);

  // ملاحظة توضيحية لو في أصناف كاملة بلا وزن تقريبي
  let note = els.cartDrawer.querySelector(".cart-note");
  if (!note) {
    note = document.createElement("div");
    note.className = "cart-note";
    note.style.cssText = "color:#666;font-size:12px;margin-top:8px;";
    els.cartDrawer.querySelector(".drawer-footer").appendChild(note);
  }
  note.textContent = hasUnpriced
    ? "تنبيه: يوجد أصناف تُباع كاملة وسيُحدد سعرها النهائي بعد الوزن. الإجمالي لا يشملها."
    : "";

  updateWALink();
}

function updateWALink() {
  const lines = state.cart.map((x) => {
    const qtyText = lineQtyText(x);
    const priceText =
      x.sellMode === 2 ? `${priceFmt(x.price)} / كجم` : `${priceFmt(x.price)}`;
    const approxText =
      x.sellMode === 2 && x.approxKg > 0
        ? ` — تقديري/قطعة: ~${x.approxKg}كجم`
        : "";
    const noteText = x.note ? ` — ملاحظة: ${x.note}` : "";
    return `• ${x.name} — ${
      x.cut || "بدون"
    } — الكمية: ${qtyText} — السعر: ${priceText}${approxText}${noteText}`;
  });

  const { total, hasUnpriced } = calcTotals();
  const totalLine = `الإجمالي: ${priceFmt(total)}${
    hasUnpriced ? " (لا يشمل أصناف كاملة بدون وزن تقريبي)" : ""
  }`;

  const msgRaw = `طلب جديد من موقع مزارع البركات:\n\n${lines.join(
    "\n"
  )}\n\n${totalLine}`;
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
