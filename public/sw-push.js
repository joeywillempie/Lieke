// Push notification handler — wordt geladen naast de vite-plugin-pwa service worker

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Lieke', body: event.data.text() }
  }

  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'lieke-reminder',
    data: { url: data.url || '/kalender' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Bekijken' },
      { action: 'dismiss', title: 'Sluiten' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Lieke', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/kalender'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus bestaand venster als dat er is
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Anders: nieuw venster openen
      return clients.openWindow(url)
    })
  )
})
