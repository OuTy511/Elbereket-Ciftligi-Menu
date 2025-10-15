/* ===== منيو الموبايل ===== */
const hb = document.querySelector(".menu-toggle");
const navMob = document.querySelector(".nav-mobile");
const navUl = document.querySelector(".nav-mobile .navm-list");

if (hb && navMob && navUl) {
  const toggle = () => {
    const opened = navMob.classList.toggle("open");
    hb.classList.toggle("active", opened);
    hb.setAttribute("aria-expanded", String(opened));
    navUl.style.maxHeight = opened ? navUl.scrollHeight + "px" : null;
  };
  hb.addEventListener("click", toggle);
  navMob.addEventListener("click", (e) => {
    if (e.target.tagName === "A") toggle();
  });
}

/* ===== سكرول ناعم للأقسام داخل نفس الصفحة ===== */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// نسخ سريع + توست
(() => {
  const toast = document.getElementById("copyToast");
  const showToast = (msg = "تم النسخ ✅") => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1500);
  };

  document.querySelectorAll(".c-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(value);
        showToast();
      } catch {
        showToast("لم يتم النسخ، انسخ يدويًا");
      }
    });
  });
})();

/* زر العودة للأعلى */
(() => {
  const btn = document.getElementById("backToTopHome");
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
