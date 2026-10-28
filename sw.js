// Permite instalar el panel como app en el celular y que abra rápido aunque la señal sea mala.
// Los datos siempre llegan en vivo desde Firebase; aquí solo se guarda la "cáscara" de la app.
const CACHE = "babira-v1";
const BASE = ["admin.html", "estilos.css", "panel.css", "js/admin.js?v=20261029a", "js/fb.js?v=20261029a", "js/config.js?v=20261029a", "img/logo-babira.png"];

self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Red primero (siempre lo más nuevo); si no hay señal, la copia guardada
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return r;
  }).catch(() => caches.match(e.request)));
});
self.addEventListener("notificationclick", e => { e.notification.close(); e.waitUntil(self.clients.openWindow("admin.html")); });
