
self.addEventListener('install', (event) => {
    // Use latest version
    console.log('Service Worker: Installed');
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Minimal passthrough
    // We can add distinct caching strategies here later
});
