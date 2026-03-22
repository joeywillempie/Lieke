import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { detectType, fetchYoutubeMetadata, fetchUrlMetadata, uploadTipImage } from '../lib/helpers'
import { CATEGORIES } from '../constants/categories'
import { YEARS } from '../constants/years'
import { Loader2, Link, CheckSquare, Square, ImagePlus, X } from 'lucide-react'

const EMPTY_FORM = {
  title: '',
  note: '',
  type: 'text',
  url: '',
  thumbnail_url: '',
  years: [],
  always_relevant: false,
  categories: [],
  source_label: '',
  proven: false,
  created_by: '',
}

export default function TipForm({ initialData, onSave }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialData || EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const metaRequestRef = useRef(0)
  const urlDebounceRef = useRef(null)
  const imageInputRef = useRef(null)

  async function handleUrlChange(url) {
    const type = detectType(url)
    setForm((f) => ({ ...f, url, type }))

    // Annuleer eventuele lopende debounce
    if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current)

    if (!url || !url.startsWith('http')) return

    if (type === 'youtube') {
      const requestId = ++metaRequestRef.current
      setFetchingMeta(true)
      try {
        const meta = await fetchYoutubeMetadata(url)
        if (requestId !== metaRequestRef.current) return
        if (meta) {
          setForm((f) => ({
            ...f,
            title: f.title || meta.title || '',
            thumbnail_url: f.thumbnail_url || meta.thumbnail_url || '',
            source_label: f.source_label || `YouTube: ${meta.author_name || ''}`,
          }))
        }
      } catch {
        // stil falen: YouTube metadata is optioneel
      } finally {
        if (requestId === metaRequestRef.current) setFetchingMeta(false)
      }
    } else {
      // Voor andere URLs: wacht 800ms (debounce) voor de request
      urlDebounceRef.current = setTimeout(async () => {
        const requestId = ++metaRequestRef.current
        setFetchingMeta(true)
        try {
          const meta = await fetchUrlMetadata(url)
          if (requestId !== metaRequestRef.current) return
          if (meta) {
            setForm((f) => ({
              ...f,
              title: f.title || meta.title || '',
              thumbnail_url: f.thumbnail_url || meta.thumbnail_url || '',
            }))
          }
        } catch {
          // stil falen
        } finally {
          if (requestId === metaRequestRef.current) setFetchingMeta(false)
        }
      }, 800)
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await uploadTipImage(file, supabase)
      setForm((f) => ({ ...f, thumbnail_url: url }))
    } catch {
      setSaveError('Afbeelding uploaden mislukt. Controleer of de "tip-images" bucket bestaat in Supabase Storage.')
    } finally {
      setUploadingImage(false)
      // Reset file input
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  function toggleYear(year) {
    setForm((f) => ({
      ...f,
      years: f.years.includes(year) ? f.years.filter((y) => y !== year) : [...f.years, year],
    }))
  }

  function toggleCategory(cat) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return

    setSaving(true)
    setSaveError(null)
    const payload = {
      ...form,
      years: form.always_relevant ? [] : form.years,
    }

    try {
      const result = await onSave(payload)
      if (result?.id) {
        navigate(`/tip/${result.id}`)
      } else {
        navigate('/')
      }
    } catch {
      setSaveError('Opslaan mislukt. Controleer je verbinding en probeer het opnieuw.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 pb-8 space-y-5">
      {/* URL */}
      <div>
        <label className="block text-sm font-bold text-stone-700 mb-1.5">
          Link (optioneel)
        </label>
        <div className="relative">
          <Link className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
          <input
            type="url"
            value={form.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://youtube.com/watch?v=... of podcast link"
            className="w-full pl-9 pr-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white"
          />
          {fetchingMeta && (
            <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-orange-400" />
          )}
        </div>
        {form.type !== 'text' && (
          <p className="text-xs text-stone-400 mt-1">
            Type gedetecteerd: <span className="font-bold text-orange-600">{form.type}</span>
          </p>
        )}
      </div>

      {/* Afbeelding */}
      <div>
        <label className="block text-sm font-bold text-stone-700 mb-1.5">
          Afbeelding (optioneel)
        </label>

        {form.thumbnail_url ? (
          <div className="space-y-1.5">
            <div className="relative rounded-xl overflow-hidden h-36 bg-stone-100">
              <img src={form.thumbnail_url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, thumbnail_url: '' }))}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1 shadow-sm"
              >
                <X className="w-4 h-4 text-stone-600" />
              </button>
            </div>
            {/* Eigen afbeelding uploaden als vervanging */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-orange-200 rounded-xl py-2 text-xs font-bold text-orange-400 hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              {uploadingImage ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Uploaden...</>
              ) : (
                <><ImagePlus className="w-3 h-3" /> Andere afbeelding kiezen</>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-200 rounded-xl py-4 text-sm font-bold text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            {uploadingImage ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploaden...</>
            ) : (
              <><ImagePlus className="w-4 h-4" /> Afbeelding kiezen</>
            )}
          </button>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Titel */}
      <div>
        <label className="block text-sm font-bold text-stone-700 mb-1.5">
          Titel <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Geef het advies een titel"
          required
          className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white"
        />
      </div>

      {/* Notitie */}
      <div>
        <label className="block text-sm font-bold text-stone-700 mb-1.5">
          Persoonlijke notitie
        </label>
        <textarea
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="Jouw eigen context of samenvatting..."
          rows={3}
          className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white resize-none"
        />
      </div>

      {/* Bron label */}
      <div>
        <label className="block text-sm font-bold text-stone-700 mb-1.5">
          Bron
        </label>
        <input
          type="text"
          value={form.source_label}
          onChange={(e) => setForm((f) => ({ ...f, source_label: e.target.value }))}
          placeholder="bijv. Boek: Het Explosieve Kind"
          className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white"
        />
      </div>

      {/* Aangemaakt door */}
      <div>
        <label className="block text-sm font-bold text-stone-700 mb-1.5">
          Aangemaakt door
        </label>
        <input
          type="text"
          value={form.created_by}
          onChange={(e) => setForm((f) => ({ ...f, created_by: e.target.value }))}
          placeholder="bijv. Joey, Mama, Papa"
          className="w-full px-4 py-2.5 border border-orange-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 bg-white"
        />
      </div>

      {/* Altijd relevant toggle */}
      <div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, always_relevant: !f.always_relevant }))}
          className="flex items-center gap-2 text-sm font-bold text-stone-700"
        >
          {form.always_relevant ? (
            <CheckSquare className="w-5 h-5 text-orange-500" />
          ) : (
            <Square className="w-5 h-5 text-stone-400" />
          )}
          Altijd relevant (alle leeftijden)
        </button>
      </div>

      {/* Jaar selectie */}
      {!form.always_relevant && (
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Van toepassing op jaar(en)
          </label>
          <div className="grid grid-cols-6 gap-2">
            {YEARS.map((year, i) => {
              const isSelected = form.years.includes(year)
              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => toggleYear(year)}
                  className={`py-2 rounded-xl text-sm font-bold transition-colors ${
                    isSelected
                      ? 'bg-orange-400 text-white shadow-sm'
                      : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                  } ${i === YEARS.length - 1 && YEARS.length % 6 !== 0 ? 'col-span-2' : ''}`}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Categorie selectie */}
      <div>
        <label className="block text-sm font-bold text-stone-700 mb-2">Categorieën</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = form.categories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-colors ${
                  isSelected
                    ? 'border-orange-400 bg-orange-400 text-white'
                    : 'border-orange-200 text-orange-600 hover:bg-orange-50'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bewezen */}
      <div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, proven: !f.proven }))}
          className="flex items-center gap-2 text-sm font-bold text-stone-700"
        >
          {form.proven ? (
            <CheckSquare className="w-5 h-5 text-green-500" />
          ) : (
            <Square className="w-5 h-5 text-stone-400" />
          )}
          Bewezen: werkt voor onze dochter
        </button>
      </div>

      {/* Foutmelding opslaan */}
      {saveError && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{saveError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !form.title.trim()}
        className="w-full bg-orange-400 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Opslaan...' : 'Advies opslaan'}
      </button>
    </form>
  )
}
