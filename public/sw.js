self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'FM Argentina';
  const options = {
    body: data.body || '',
    icon: '/icon-192.svg',
    badge: '/icon-192.svg',
    tag: data.tag || 'fm-argentina',
    data: data.url || '/'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Send deep-link tag to the client
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('/') && 'postMessage' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            tag: event.notification.tag
          });
        }
      }
      // Also open the window if no clients are open
      if (clientList.length === 0) {
        return clients.openWindow('/');
      }
    })
  );
});