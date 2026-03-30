import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Converteer base64url naar Uint8Array (nodig voor pushManager.subscribe)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getPermissionState() {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission // 'default', 'granted', 'denied'
}

export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error('Push notificaties worden niet ondersteund op dit apparaat')

  // Vraag toestemming
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notificatie-toestemming geweigerd')
  }

  // Wacht op service worker (de hoofd-SW bevat al de push handler)
  const registration = await navigator.serviceWorker.ready

  // Subscribe bij push service
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  // Sla op in Supabase
  const subJson = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: subJson.endpoint,
    keys_p256dh: subJson.keys.p256dh,
    keys_auth: subJson.keys.auth,
    subscription_json: subJson,
  }, { onConflict: 'endpoint' })

  if (error) throw new Error('Kon abonnement niet opslaan: ' + error.message)

  // Bewaar status lokaal
  localStorage.setItem('push-enabled', 'true')
  return subscription
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    // Verwijder uit Supabase
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    // Unsubscribe bij push service
    await subscription.unsubscribe()
  }

  localStorage.removeItem('push-enabled')
}

export function isLocallyEnabled() {
  return localStorage.getItem('push-enabled') === 'true'
}
