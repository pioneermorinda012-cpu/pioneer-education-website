/* Pioneer Education — service worker.
 * Shows practice reminders (push notifications). Every message is also kept
 * on the phone (IndexedDB "pioneer" → "inbox", the last 30), so it can still
 * be read after the notification is gone: tapping one opens the site with the
 * message shown at the top, and the 🔔 button lists them all
 * (components/practice/PushOptIn.tsx reads the same store).
 * It does not cache pages, so students always see the latest site. */
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });

function db() {
  return new Promise(function (ok, no) {
    var r = indexedDB.open("pioneer", 1);
    r.onupgradeneeded = function () { r.result.createObjectStore("inbox", { keyPath: "id" }); };
    r.onsuccess = function () { ok(r.result); };
    r.onerror = function () { no(r.error); };
  });
}
function keep(msg) {
  return db().then(function (d) {
    return new Promise(function (ok) {
      var t = d.transaction("inbox", "readwrite"), s = t.objectStore("inbox");
      s.put(msg);
      var all = s.getAll();
      all.onsuccess = function () {
        var list = all.result.sort(function (a, b) { return b.at - a.at; });
        for (var i = 30; i < list.length; i++) s.delete(list[i].id);
      };
      t.oncomplete = function () { ok(); };
      t.onerror = function () { ok(); };
    });
  }).catch(function () {});
}

self.addEventListener("push", function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : "" }; }
  var msg = {
    id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
    title: d.title || "Pioneer Education",
    body: d.body || "Time for a little practice.",
    url: d.url || "/practice",
    at: Date.now()
  };
  e.waitUntil(Promise.all([
    keep(msg),
    self.registration.showNotification(msg.title, {
      body: msg.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: d.tag || "pioneer",
      renotify: true,
      data: { url: msg.url, id: msg.id }
    })
  ]));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  // open the page with the message's id, so the page can show the message itself
  var u = new URL(data.url || "/practice", self.location.origin);
  if (data.id) u.searchParams.set("pmsg", data.id);
  var url = u.href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.location.origin) === 0 && "focus" in c) {
        // an open tab of the site: bring it forward and go to the page
        // (a tab this worker does not control cannot be moved, so open a new one)
        return c.focus().then(function (w) { return (w || c).navigate(url); })
          .then(function (w) { return w || self.clients.openWindow(url); })
          .catch(function () { return self.clients.openWindow(url); });
      }
    }
    return self.clients.openWindow(url);
  }));
});
