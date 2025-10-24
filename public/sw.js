// Service Worker para PWA
const CACHE_NAME = 'brutal-team-v1';
const urlsToCache = [
  '/',
  '/login',
  '/cadastro',
  '/manifest.json',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Ativação do Service Worker
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
    })
  );
  self.clients.claim();
});

// Estratégia: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de outros domínios (CORS)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    return;
  }

  // Ignorar requisições de API do Supabase
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Apenas cachear respostas bem-sucedidas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clonar a resposta
        const responseClone = response.clone();

        // Cachear a nova resposta
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // Se a network falhar, buscar no cache
        return caches.match(event.request);
      })
  );
});
