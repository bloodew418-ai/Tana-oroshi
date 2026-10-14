/* アカウント棚卸し Service Worker
   - 同じ場所（このアプリのフォルダ）のファイルだけをキャッシュし、外部へは一切通信しない
   - 更新時：VERSION を変えると新しいキャッシュを作り、古いキャッシュを削除する
   - 保存データ（localStorage）には触れない */
var VERSION = "2026-10-14.1";
var CACHE = "tanaoroshi-" + VERSION;
var FILES = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      /* HTTPキャッシュを経由せず最新を取得してから保存する */
      return c.addAll(FILES.map(function (u) { return new Request(u, { cache: "reload" }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf("tanaoroshi-") === 0 && k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* 外部は扱わない（アプリ側でもCSPで禁止） */
  if (req.mode === "navigate") {
    /* 画面の読み込みは常にキャッシュ済みの index.html を返す（機内モードでも起動） */
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return c.match("./index.html").then(function (hit) { return hit || fetch(req); });
      })
    );
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(req, { ignoreSearch: true }).then(function (hit) { return hit || fetch(req); });
    })
  );
});
