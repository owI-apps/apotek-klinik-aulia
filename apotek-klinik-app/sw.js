/**
 * Service Worker - untuk PWA (offline support dasar)
 */

var CACHE_NAME = 'apotek-klinik-v1';
var URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/utils.js',
    '/js/app.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/manifest.json'
];

// Install: simpan file ke cache
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.filter(function(name) {
                    return name !== CACHE_NAME;
                }).map(function(name) {
                    return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: coba cache dulu, kalau nggak ada baru ke network
self.addEventListener('fetch', function(event) {
    // Lewati request ke Firebase (nggak bisa di-cache)
    if (event.request.url.indexOf('firebaseio.com') !== -1 ||
        event.request.url.indexOf('googleapis.com') !== -1 ||
        event.request.url.indexOf('google.com') !== -1) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request).then(function(fetchResponse) {
                // Simpan response baru ke cache
                if (fetchResponse.status === 200) {
                    var responseClone = fetchResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return fetchResponse;
            });
        }).catch(function() {
            // Kalau offline dan nggak ada di cache
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
