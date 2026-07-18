// Madrasa Management System — Service Worker
// ആപ്പ് ഓഫ്‌ലൈൻ ആയി തുറക്കാൻ വേണ്ടി പേജ് ബ്രൗസറിൽ കാഷെ ചെയ്ത് വെക്കുന്നു.
// ഡാറ്റ (വിദ്യാർത്ഥികൾ, മാർക്ക്, ഫീസ് തുടങ്ങിയവ) ഇതിൽ ഉൾപ്പെടില്ല —
// അതെല്ലാം ബ്രൗസറിന്റെ localStorage-ൽ ആണ് സൂക്ഷിക്കുന്നത്, അതുകൊണ്ട് അതും ഓഫ്‌ലൈൻ ലഭ്യമാണ്.

const CACHE_NAME = 'madrasa-app-shell-v1';
const APP_SHELL = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Google Apps Script API കോളുകൾ (ഡാറ്റ സേവ്/ലോഡ്) കാഷെ ചെയ്യേണ്ട —
  // അവ എപ്പോഴും നെറ്റ്‌വർക്കിലേക്ക് തന്നെ പോകട്ടെ, പരാജയപ്പെട്ടാൽ ആപ്പ് അത് കൈകാര്യം ചെയ്യും
  if (req.url.includes('script.google.com')) {
    return;
  }

  // പേജ് നാവിഗേഷൻ / ബാക്കി റിക്വസ്റ്റുകൾ: network first, ഓഫ്‌ലൈൻ ആണെങ്കിൽ കാഷെയിൽ നിന്ന്
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
