// Tour Studio — this tour, saved for offline viewing. Written by the export.
'use strict';
var PREFIX = 'tour-offline:';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  if (req.url.indexOf(self.registration.scope) !== 0) return;
  e.respondWith(answer(req));
});

function savedCopy() {
  var mine = PREFIX + self.registration.scope + '|';
  return caches.keys().then(function (keys) {
    var name = keys.filter(function (k) { return k.indexOf(mine) === 0; })[0];
    return name ? caches.open(name) : null;
  });
}

function within(promise, ms) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { reject(new Error('slow network')); }, ms);
    promise.then(function (r) { clearTimeout(timer); resolve(r); }, function (err) { clearTimeout(timer); reject(err); });
  });
}

function answer(req) {
  return savedCopy().then(function (copy) {
    if (!copy) return fetch(req);
    if (req.mode === 'navigate') {
      return within(fetch(req), 4000).catch(function () {
        return copy.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || copy.match(self.registration.scope).then(function (home) {
            return home || Response.error();
          });
        });
      });
    }
    return copy.match(req).then(function (hit) { return hit || fetch(req); });
  });
}
