const CACHE_NAME = 'parttracker-cache';
const DYNCACHE_NAME = 'parttracker-dynamic-cache';
const urls_to_cache = [
    '/',
    '/css/single.css',
    '/dist/css/bootstrap.min.css',
    '/js/single.js',
    '/dist/js/jquery.min.js',
    '/dist/js/bootstrap.min.js'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(
            (cache) => {
                console.log(`Opened cache ${CACHE_NAME}`);
                return cache.addAll(urls_to_cache);
            }
        )
    );
});

async function getFetchResponse(event) {
    if(event.request.method.toUpperCase() !== 'GET') {
        // non-GET requests always go to network
        return event.respondWith(fetch(event.request));
    }

    if(event.request.url.contains('/api/')) {
        // for API / dynamic content:
        // always go to network, but cache as we go
        var cache = await caches.open(DYNCACHE_NAME);
        var res = await fetch(event.request);

        cache.put(event.request, res.clone());
        return event.respondWith(res);
    } else {
        // for all other content:
        // go to cache first, fall back to network
        var res = await caches.match(event.request);

        if(res) {
            return event.respondWith(res);
        }

        return event.respondWith(fetch(res.request));
    }
}

self.addEventListener('fetch', getFetchResponse);
