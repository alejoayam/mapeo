const CACHE_NAME = 'mapeo-v6';
const ASSETS = [
	'/',
	'/index.html',
	'/styles.css',
	'/app.js',
	'/manifest.json',
	'/icons/icon-192.png',
	'/icons/icon-512.png',
	'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
	'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
];

self.addEventListener('install', (e) => {
	e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
	e.respondWith(
		caches.match(e.request).then((response) => response || fetch(e.request))
	);
});
