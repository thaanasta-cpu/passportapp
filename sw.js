const CACHE = 'passport-v17';
const ASSETS = [
  '/passportapp/',
  '/passportapp/index.html',
];

// Install — cache the app shell
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', function(e){
  // Skip non-GET and cross-origin (Unsplash, fonts, etc)
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if(url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response){
        // Cache successful responses
        if(response && response.status === 200){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function(){
        // Offline fallback
        return caches.match(e.request).then(function(cached){
          return cached || caches.match('/passportapp/index.html');
        });
      })
  );
});
