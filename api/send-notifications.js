import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:lieke@parentlog.app',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  // Optioneel: verificeer cron secret
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const now = new Date()
    const results = { checked: 0, sent: 0, errors: 0, skipped: 0 }

    // Haal alle afspraken op die een datum + tijd hebben
    // We checken events in de komende 25 uur
    const futureDate = new Date(now.getTime() + 25 * 60 * 60 * 1000)
    const fromDate = now.toISOString().slice(0, 10)
    const toDate = futureDate.toISOString().slice(0, 10)

    const { data: events, error: evError } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)

    if (evError) {
      console.error('Events query error:', evError)
      return res.status(500).json({ error: 'Kon afspraken niet ophalen' })
    }

    if (!events?.length) {
      return res.status(200).json({ message: 'Geen aankomende afspraken', ...results })
    }

    // Haal alle push subscriptions op
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (subError || !subscriptions?.length) {
      return res.status(200).json({ message: 'Geen push abonnementen', ...results })
    }

    // Per event: check of 24u of 2u reminder gestuurd moet worden
    for (const event of events) {
      results.checked++

      // Parse event datetime (Europe/Amsterdam timezone)
      const eventTime = event.time || '09:00' // default 09:00 voor hele-dag events
      const [eventH, eventM] = eventTime.split(':').map(Number)

      // Maak een Date object voor het event in Amsterdam tijd
      // We construeren het als UTC en compenseren voor CET/CEST
      const eventDateStr = `${event.date}T${String(eventH).padStart(2, '0')}:${String(eventM).padStart(2, '0')}:00`

      // Gebruik de server-locale (Vercel draait in UTC)
      // Amsterdam = UTC+1 (winter) of UTC+2 (zomer)
      // Eenvoudige benadering: gebruik een vaste offset
      const eventDate = new Date(eventDateStr + '+01:00') // CET

      const diffMs = eventDate.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)

      // Bepaal welke reminders nodig zijn
      const reminders = []

      // 24 uur reminder: stuur als event 23-25 uur in de toekomst is
      if (diffHours >= 23 && diffHours <= 25) {
        reminders.push('24h')
      }
      // 2 uur reminder: stuur als event 1.5-2.5 uur in de toekomst is
      if (diffHours >= 1.5 && diffHours <= 2.5) {
        reminders.push('2h')
      }

      for (const reminderType of reminders) {
        // Check of deze reminder al gestuurd is
        const { data: existing } = await supabase
          .from('sent_notifications')
          .select('id')
          .eq('event_id', event.id)
          .eq('notification_type', reminderType)
          .limit(1)

        if (existing?.length) {
          results.skipped++
          continue
        }

        // Maak notificatie-tekst
        const timeStr = event.time ? ` om ${event.time}` : ''
        const locStr = event.location ? ` — ${event.location}` : ''
        const title = reminderType === '24h'
          ? `Morgen: ${event.what}`
          : `Over 2 uur: ${event.what}`
        const body = reminderType === '24h'
          ? `Morgen${timeStr}${locStr}`
          : `Vandaag${timeStr}${locStr}`

        const payload = JSON.stringify({
          title,
          body,
          url: '/kalender',
          tag: `reminder-${event.id}-${reminderType}`,
        })

        // Stuur naar alle subscriptions
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(sub.subscription_json, payload)
            results.sent++
          } catch (pushError) {
            results.errors++
            // 410 Gone = subscription verlopen, verwijder het
            if (pushError.statusCode === 410 || pushError.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            }
            console.error('Push error:', pushError.statusCode, pushError.message)
          }
        }

        // Markeer als gestuurd
        await supabase.from('sent_notifications').insert({
          event_id: event.id,
          notification_type: reminderType,
        })
      }
    }

    return res.status(200).json({ message: 'OK', ...results })
  } catch (err) {
    console.error('Send notifications error:', err)
    return res.status(500).json({ error: err.message })
  }
}
