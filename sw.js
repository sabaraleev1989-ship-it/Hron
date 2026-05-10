const CACHE_NAME = 'xron-scorpion-v2'; // Увеличьте версию, чтобы обновить кеш у пользователей

// Файлы, которые обязательно должны быть сохранены для офлайн-работы
const urlsToCache = [
  '/',                     // Главная страница
  'index.html',            // HTML-файл
  'logo.png',              // <-- ВАШ ЛОГОТИП (ОБЯЗАТЕЛЬНО)
  'manifest.json'          // Манифест
  // Если у вас есть favicon, добавьте его сюда же: 'favicon.ico'
];

// Установка: сохраняем все нужные файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кеширование ресурсов...');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Ошибка кеширования:', err);
      })
  );
  // Активируем новый кеш сразу, не дожидаясь закрытия старых вкладок
  self.skipWaiting();
});

// Активация: удаляем старые кеши (чистим место)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Удаление старого кеша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Берем контроль над всеми страницами без перезагрузки
  return self.clients.claim();
});

// Перехват запросов: отдаем из кеша, если нет сети
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Файл найден в кеше — возвращаем его
        if (response) {
          return response;
        }
        // Файла нет в кеше — пытаемся загрузить из сети
        return fetch(event.request).catch(() => {
          // Если сеть недоступна, можно отдать fallback (страницу заглушку)
          // Т.к. у нас SPA, просто игнорируем ошибку
          // Для пустоты можно возвращать Response с ошибкой, но лучше ничего не делать
          if (event.request.destination === 'document') {
            return caches.match('/'); // fallback на главную
          }
        });
      })
  );
});
