/**
 * Service Worker - Versi Tangguh
 * Strategi: Cache on Fetch (bukan pre-cache)
 * Setiap file yang berhasil dibuka akan otomatis di-cache
 * Tidak ada addAll() yang bisa gagal
 */

var CACHE_NAME = 'apotek-klinik-v2';

// Install: langsung aktif tanpa pre-cache
self.addEventListener('install', function(event) {
    self.skipWaiting();
});

// Activate: hapus cache versi lama
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

// Fetch: cache setiap request yang berhasil
self.addEventListener('fetch', function(event) {
    // Lewati request ke Firebase (gak boleh di-cache)
    var url = event.request.url;
    if (url.indexOf('firebaseio.com') !== -1 ||
        url.indexOf('googleapis.com') !== -1 ||
        url.indexOf('google.com') !== -1) {
        return;
    }

    // Hanya cache request GET dari domain sendiri
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.match(event.request).then(function(response) {
                // Kalau sudah ada di cache, pakai cache
                if (response) {
                    return response;
                }
                // Kalau belum ada, ambil dari network
                return fetch(event.request).then(function(networkResponse) {
                    // Kalau berhasil & status 200, simpan ke cache
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(function() {
                    // Kalau offline & tidak ada di cache
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            });
        })
    );
});
