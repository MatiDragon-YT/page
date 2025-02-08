// This is the "Offline page" service worker

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// Versión actualizada del Service Worker para manejar la página offline

const CACHE_NAME = "1.4.7-1";
const OFFLINE_URL = "index.html";
const ASSETS = [
  "/index.html",
  "/styles.css",
  "/css.js",
  '/manifest.json',
  '/script.js',
  '/sw.js',
  '/data/classes.db',
  '/data/constants.txt',
  '/data/CustomVariables.ini',
  '/data/models.ide',
  '/data/opcodes.txt',
  '/data/sa.json',
  '/data/sa_mobile.json'
  // Agrega aquí otros recursos que quieras precachear
];

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS)
        console.log(ASSETS)
      })
      .catch((error) => {
        console.error(`onRejected function called: ${error.message}`);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Lista de archivos que se actualizarán siempre desde la red
  const alwaysUpdateFiles = ['/index.html', 'index.html', '/script.js', '/sw.js', '/styles.css', 'styles.css', '/css.js'];

  // Si la solicitud es para alguno de estos archivos...
  if (alwaysUpdateFiles.some(path => event.request.url.endsWith(path))) {
    event.respondWith(
      fetch(event.request)
      .then((networkResponse) => {
        // Abre la caché y actualiza el recurso con la versión de la red
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      })
      .catch(() => {
        // En caso de error (por ejemplo, sin conexión), se intenta servir de la caché
        return caches.match(event.request);
      })
    );
  } else {
    // Para otros recursos, se sigue con la estrategia actual
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
      );
    } else {
      event.respondWith(
        caches.match(event.request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(event.request)
            .then((response) => {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
                return response;
              });
            });
        })
      );
    }
  }
});


