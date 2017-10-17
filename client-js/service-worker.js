const CACHE_NAME = 'parttracker-cache';
const DYNCACHE_NAME = 'parttracker-dynamic-cache';
const urls_to_cache = [
    '/css/single.css',
    '/dist/css/bootstrap.min.css',
    '/js/single.js',
    '/dist/js/jquery.min.js',
    '/dist/js/bootstrap.min.js',
    '/dist/fonts/glyphicons-halflings-regular.woff2'
];

const api_urls_to_cache = [
    '/api/inventory',
    '/api/reservations',
    '/api/requests',
    '/api/users',
    '/api/activities',
]

async function handleInstall(event) {
    var [static_cache, dynamic_cache] = await Promise.all([
        caches.open(CACHE_NAME),
        caches.open(DYNCACHE_NAME)
    ]);

    console.log(`Opened caches ${CACHE_NAME} and ${DYNCACHE_NAME}`);

    // API requests need auth
    var api_fetches = api_urls_to_cache.map(
        async (url) => {
            var res = await fetch(url, {
                credentials: 'include',
                headers: {"Accept": "application/json"},
            });

            if(!res.ok) throw res;
            return dynamic_cache.put(url, res);
        }
    );

    // '/' will redirect to '/login' when doing a default fetch
    var root_pg = await fetch('/single.html');
    if(!root_pg.ok) throw root_pg;

    return Promise.all([
        static_cache.put('/inventory', root_pg.clone()),
        static_cache.put('/requests', root_pg.clone()),
        static_cache.put('/activities', root_pg.clone()),
        static_cache.put('/users', root_pg.clone()),
        static_cache.put('/login', root_pg.clone()),
        static_cache.put('/', root_pg),
        static_cache.addAll(urls_to_cache),
        api_fetches
    ]);
}

self.addEventListener('install', function(event) {
    event.waitUntil(handleInstall(event));
});

async function getFetchResponse(event) {
    console.log(`SW: intercepted ${event.request.method.toUpperCase()} request to ${event.request.url}`);

    if(event.request.method.toUpperCase() !== 'GET') {
        // non-GET requests always go to network
        return fetch(event.request);
    }

    var url = event.request.url;
    if(url.includes('api/')) {
        // for API / dynamic content:
        // always go to network, but cache as we go
        var cache = await caches.open(DYNCACHE_NAME);
        var res = await fetch(event.request);

        cache.put(event.request, res.clone());
        return res;
    } else {
        // for all other content:
        // go to cache first, fall back to network
        var res = await caches.match(event.request);

        if(res) {
            return res;
        }

        return fetch(event.request);
    }
}

self.addEventListener('fetch', function(event) {
    event.respondWith(getFetchResponse(event));
});
