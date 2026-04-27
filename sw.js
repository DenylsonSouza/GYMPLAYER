// Aumentámos para V2. Isto força o telemóvel a apagar a cache antiga e instalar a nova!
const CACHE_NAME = 'monster-v2'; 

const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-512.png'
];

// FASE 1: Instalação - Guarda apenas os ficheiros locais seguros
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Força o telemóvel a usar esta nova versão imediatamente
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('A instalar Cache Base...');
      return cache.addAll(LOCAL_ASSETS);
    })
  );
});

// FASE 2: Limpeza - Apaga a versão V1 defeituosa
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// FASE 3: Interceção Dinâmica (O Segredo)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // 1. Se já está na mochila, devolve imediatamente (Offline)
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 2. Se não está, vai à internet procurar
      return fetch(e.request).then(networkResponse => {
        // Se a resposta for inválida, apenas devolve
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
          return networkResponse;
        }

        // 3. Se a internet encontrou algo novo (ex: Ícones), guarda uma cópia na mochila para a próxima vez!
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          // Ignora pedidos de extensões do Chrome ou coisas estranhas
          if (e.request.url.startsWith('http')) {
            cache.put(e.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        console.log("Offline absoluto e ficheiro não encontrado na cache.");
      });
    })
  );
});
