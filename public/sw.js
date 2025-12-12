const CACHE_NAME = 'regular-mei-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/manifest.webmanifest',
  // Adicione aqui outros ativos estáticos importantes (JS, CSS, imagens)
  // Como estamos no ambiente Vite, o Service Worker não pode ver os bundles gerados,
  // então focamos nos arquivos de entrada e no HTML.
];

// Instalação: Cacheia os ativos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Intercepta requisições e serve do cache ou da rede
self.addEventListener('fetch', (event) => {
  // Estratégia Cache-first para ativos estáticos
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna o recurso do cache se encontrado
        if (response) {
          return response;
        }
        
        // Se não estiver no cache, busca na rede
        return fetch(event.request).then(
          (response) => {
            // Verifica se recebemos uma resposta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta. Uma resposta é um stream e só pode ser consumida uma vez.
            const responseToCache = response.clone();

            // Cacheia a nova requisição para uso futuro
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});