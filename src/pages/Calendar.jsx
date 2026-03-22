import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, FileText, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TimePicker from '../components/TimePicker'
import { BIRTH_DATE } from '../constants/config'

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

function getLiekesMonths(year, month) {
  return (year - BIRTH_DATE.getFullYear()) * 12 + (month - BIRTH_DATE.getMonth())
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7 // Ma=0 … Zo=6
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const EMPTY_FORM = { what: '', time: '', location: '' }

export default function Calendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [events, setEvents] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const formRef = useRef(null)

  useEffect(() => { loadEvents() }, [viewYear, viewMonth])

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [showForm])

  async function loadEvents() {
    setLoadError(null)
    const from = toDateStr(viewYear, viewMonth, 1)
    const to = toDateStr(viewYear, viewMonth, getDaysInMonth(viewYear, viewMonth))
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('time', { nullsFirst: true })
    if (error) {
      console.error('Laden mislukt:', error)
      setLoadError('Kalender kon niet geladen worden. Probeer het opnieuw.')
    }
    setEvents(data || [])
  }

  async function addEvent() {
    if (!form.what.trim() || !selectedDay) return
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase.from('calendar_events').insert({
      date: toDateStr(viewYear, viewMonth, selectedDay),
      what: form.what.trim(),
      time: form.time || null,
      location: form.location.trim() || null,
    })
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    setForm(EMPTY_FORM)
    setShowForm(false)
    loadEvents()
  }

  async function updateEvent() {
    if (!form.what.trim() || !editingId) return
    setSaving(true)
    setSaveError(null)
    const { error } = await supabase.from('calendar_events').update({
      what: form.what.trim(),
      time: form.time || null,
      location: form.location.trim() || null,
    }).eq('id', editingId)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    loadEvents()
  }

  function startEdit(ev) {
    setEditingId(ev.id)
    setForm({ what: ev.what, time: ev.time || '', location: ev.location || '' })
    setShowForm(true)
  }

  function cancelForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaveError(null)
  }

  async function deleteEvent(id) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) {
      setSaveError('Verwijderen mislukt: ' + error.message)
      return
    }
    if (editingId === id) cancelForm()
    loadEvents()
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null); setShowForm(false)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null); setShowForm(false)
  }

  function selectDay(day) {
    if (day === selectedDay) { setSelectedDay(null); setShowForm(false) }
    else { setSelectedDay(day); setShowForm(false) }
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth)
  const liekesMonths = getLiekesMonths(viewYear, viewMonth)
  const isBirthMonth = liekesMonths >= 0

  function eventsOnDay(day) {
    return events.filter(e => e.date === toDateStr(viewYear, viewMonth, day))
  }

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : []

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Maand navigatie */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} aria-label="Vorige maand" className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-orange-500" />
        </button>
        <div className="text-center">
          <h2 className="font-serif font-bold text-xl text-stone-800">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          {isBirthMonth && (
            <p className="text-xs text-orange-400 font-semibold mt-0.5">
              Lieke is {liekesMonths} maanden oud
            </p>
          )}
        </div>
        <button onClick={nextMonth} aria-label="Volgende maand" className="p-2 rounded-xl hover:bg-orange-100 transition-colors">
          <ChevronRight className="w-5 h-5 text-orange-500" />
        </button>
      </div>

      {/* Dag-labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-stone-400 py-1">{d}</div>
        ))}
      </div>

      {/* Kalender grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
          const isBirthday = day === 20 && isBirthMonth
          const isSelected = day === selectedDay
          const dayEvents = eventsOnDay(day)

          return (
            <button
              key={day}
              onClick={() => selectDay(day)}
              className={`
                relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all
                ${isSelected ? 'bg-orange-400 text-white shadow-md scale-105' : ''}
                ${!isSelected && isToday ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300' : ''}
                ${!isSelected && !isToday && isBirthday ? 'bg-pink-100 text-pink-600' : ''}
                ${!isSelected && !isToday && !isBirthday ? 'hover:bg-orange-50 text-stone-700' : ''}
              `}
            >
              {isBirthday && !isSelected && (
                <span className="text-[10px] leading-none mb-0.5">🎂</span>
              )}
              <span className="leading-none">{day}</span>
              {dayEvents.length > 0 && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-orange-400'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Laad-foutmelding */}
      {loadError && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center justify-between">
          <span>{loadError}</span>
          <button onClick={loadEvents} className="text-red-500 font-bold underline text-xs ml-2">Opnieuw</button>
        </div>
      )}

      {/* Dag detail */}
      {selectedDay && (
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-orange-100">
          {/* Dag header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100">
            <h3 className="font-serif font-bold text-stone-800">
              {selectedDay} {MONTHS[viewMonth]}
              {selectedDay === 20 && isBirthMonth && (
                <span className="ml-2 text-sm font-normal text-pink-500">🎂 {liekesMonths} maanden</span>
              )}
            </h3>
            <button
              onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(f => !f); setSaveError(null) }}
              className="flex items-center gap-1 bg-orange-400 hover:bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Toevoegen
            </button>
          </div>

          {/* Formulier */}
          {showForm && (
            <div ref={formRef} className="px-4 py-3 bg-orange-50 border-b border-orange-100 space-y-2">
              <p className="text-xs font-bold text-orange-500 mb-1">
                {editingId ? 'Afspraak bewerken' : 'Nieuwe afspraak'}
              </p>
              {/* Wat */}
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.what}
                  onChange={e => setForm(f => ({ ...f, what: e.target.value }))}
                  placeholder="Wat? (bijv. doktersafspraak)"
                  className="flex-1 text-sm border border-orange-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                />
              </div>
              {/* Tijd */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <TimePicker
                  value={form.time}
                  onChange={t => setForm(f => ({ ...f, time: t }))}
                />
              </div>
              {/* Locatie */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Locatie (optioneel)"
                  className="flex-1 text-sm border border-orange-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                />
              </div>
              {saveError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={cancelForm}
                  className="flex-1 text-sm text-stone-400 hover:text-stone-600 py-2 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={editingId ? updateEvent : addEvent}
                  disabled={saving || !form.what.trim()}
                  className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-40 transition-colors"
                >
                  {saving ? 'Opslaan…' : editingId ? 'Bijwerken' : 'Opslaan'}
                </button>
              </div>
            </div>
          )}

          {/* Event lijst */}
          {selectedEvents.length === 0 && !showForm ? (
            <p className="text-sm text-stone-400 text-center py-5">Geen afspraken op deze dag</p>
          ) : (
            <ul className="divide-y divide-orange-50">
              {selectedEvents.map(ev => (
                <li key={ev.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm">{ev.what}</p>
                    <div className="flex flex-wrap gap-x-3 mt-0.5">
                      {ev.time && (
                        <span className="flex items-center gap-1 text-xs text-orange-500">
                          <Clock className="w-3 h-3" />{ev.time}
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <MapPin className="w-3 h-3" />{ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    <button onClick={() => startEdit(ev)} aria-label={`Bewerk ${ev.what}`} className="text-stone-300 hover:text-orange-400 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteEvent(ev.id)} aria-label={`Verwijder ${ev.what}`} className="text-stone-300 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
