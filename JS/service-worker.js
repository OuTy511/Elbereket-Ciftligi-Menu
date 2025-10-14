const CACHE = "elbereket-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/menu.html",
  "/style/main.css",
  "/main.js",
  "/img/logos/logo-3.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
        )
      )
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches
      .match(e.request)
      .then(
        (res) =>
          res || fetch(e.request).catch(() => caches.match("/index.html"))
      )
  );
});
