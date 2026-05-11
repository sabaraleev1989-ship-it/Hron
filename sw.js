const CACHE_NAME = 'scorpion-v7';
const ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Установка
self.addEventListener('install', (e) => {
  console.log('SW: Установка...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Кеширую ресурсы:', ASSETS);
        return cache.addAll(ASSETS).catch((err) => {
          console.error('SW: Ошибка кеширования:', err);
        });
      })
  );
  self.skipWaiting();
});

// Активация + очистка старого
self.addEventListener('activate', (e) => {
  console.log('SW: Активация');
  e.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('SW: Удаляю старый кеш:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// СТРАТЕГИЯ: СНАЧАЛА КЕШ, ПОТОМ СЕТЬ (CACHE FIRST)
self.addEventListener('fetch', (e) => {
  // Не кешируем запросы к chrome-extension и не-GET запросы
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then((cached) => {
      // Отдаём из кеша если есть
      if (cached) {
        return cached;
      }
      // Если нет в кеше — идём в сеть
      return fetch(e.request).catch(() => {
        // Если сеть недоступна и это запрос страницы — отдаём index.html
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
