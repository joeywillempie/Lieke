import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TipForm from '../components/TipForm'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function AddTip() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = id && id !== 'nieuw'
  const [initialData, setInitialData] = useState(null)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEditing) return
    let cancelled = false

    supabase
      .from('tips')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError('Tip kon niet worden geladen.')
        else setInitialData(data)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [id])

  async function handleSave(payload) {
    if (isEditing) {
      const { data, error } = await supabase
        .from('tips')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase.from('tips').insert(payload).select().single()
      if (error) throw error
      return data
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-stone-100">
        <button onClick={() => navigate(-1)} className="text-stone-500 hover:text-stone-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-serif font-semibold text-stone-800 text-lg">
          {isEditing ? 'Advies bewerken' : 'Nieuw advies'}
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-green-700" />
        </div>
      ) : error ? (
        <div className="px-4 py-8 text-center text-sm text-red-600">{error}</div>
      ) : (
        <TipForm initialData={initialData} onSave={handleSave} />
      )}
    </div>
  )
}
