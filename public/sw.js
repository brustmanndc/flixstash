const CACHE_NAME = 'flixstash';

const FILES_TO_CACHE = [
    "/",
    "/home",
    "/style.css",
    "/app.js",
    "/header.js",
    "/movie",
    "/register",
    "/watchlist",
    "/login.js",
    "/movie.js",
    "/register.js",
    "/watchlist.js",
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches
        .open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches
        .match(event.request)
        .then(cacheResponse => {
            return(cacheResponse || fetch(event.request));
        })
    );
});