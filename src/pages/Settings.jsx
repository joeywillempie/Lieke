import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Printer, Download, CheckCircle, Loader2 } from 'lucide-react'

export default function Settings() {
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(null) // 'json' | 'print'

  async function exportJSON() {
    setExporting(true)
    try {
      const { data: tips } = await supabase.from('tips').select('*').order('created_at', { ascending: false })
      const { data: events } = await supabase.from('calendar_events').select('*').order('date', { ascending: true })

      const backup = {
        exported_at: new Date().toISOString(),
        tips: tips || [],
        calendar_events: events || [],
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lieke-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExported('json')
      setTimeout(() => setExported(null), 3000)
    } catch (err) {
      alert('Er ging iets mis bij het exporteren: ' + err.message)
    }
    setExporting(false)
  }

  async function exportPrint() {
    setExporting(true)
    try {
      const { data: tips } = await supabase.from('tips').select('*').order('created_at', { ascending: false })
      if (!tips?.length) {
        alert('Geen tips om te exporteren.')
        setExporting(false)
        return
      }

      // Groepeer per jaar
      const grouped = {}
      const alwaysRelevant = []

      tips.forEach((tip) => {
        if (tip.always_relevant) {
          alwaysRelevant.push(tip)
        } else if (tip.years?.length) {
          tip.years.forEach((y) => {
            if (!grouped[y]) grouped[y] = []
            grouped[y].push(tip)
          })
        } else {
          if (!grouped['overig']) grouped['overig'] = []
          grouped['overig'].push(tip)
        }
      })

      const sortedYears = Object.keys(grouped)
        .filter((k) => k !== 'overig')
        .sort((a, b) => Number(a) - Number(b))
      if (grouped['overig']) sortedYears.push('overig')

      // Voorkom XSS door HTML-tekens te escapen
    function esc(str) {
      if (!str) return ''
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }

    function tipToHTML(tip) {
        const typeLabel = tip.type === 'youtube' ? '🎬 YouTube' : tip.type === 'podcast' ? '🎙️ Podcast' : '📄 Artikel'
        const categories = tip.categories?.length ? tip.categories.map(esc).join(', ') : ''
        const proven = tip.proven ? ' ✅ Bewezen' : ''
        const noteHtml = tip.note ? esc(tip.note).replace(/\n/g, '<br>') : ''
        return `
          <div style="margin-bottom:20px;padding:14px 18px;border:1px solid #e5e5e5;border-radius:12px;page-break-inside:avoid;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="font-size:12px;color:#888;">${typeLabel}</span>
              ${categories ? `<span style="font-size:11px;color:#999;">• ${categories}</span>` : ''}
              ${proven ? `<span style="font-size:12px;">${proven}</span>` : ''}
            </div>
            <div style="font-size:16px;font-weight:bold;color:#1a1a1a;margin-bottom:8px;">${esc(tip.title)}</div>
            ${noteHtml ? `<div style="font-size:13px;color:#555;margin-bottom:10px;line-height:1.6;white-space:pre-wrap;">${noteHtml}</div>` : ''}
            ${tip.source_label ? `<div style="font-size:12px;color:#999;margin-bottom:4px;">Bron: ${esc(tip.source_label)}</div>` : ''}
            ${tip.url ? `<div style="font-size:12px;color:#7c3aed;word-break:break-all;">${esc(tip.url)}</div>` : ''}
          </div>`
      }

      const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Lieke - Alle Tips</title>
  <style>
    @media print {
      body { font-size: 12px; }
      h1 { font-size: 20px; }
      h2 { font-size: 16px; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 700px;
      margin: 0 auto;
      padding: 24px;
      color: #1a1a1a;
      background: #fff;
    }
    h1 { color: #7c3aed; margin-bottom: 4px; }
    .subtitle { color: #999; font-size: 14px; margin-bottom: 32px; }
    h2 { color: #ec4899; margin-top: 32px; margin-bottom: 12px; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px; }
  </style>
</head>
<body>
  <h1>🌟 Lieke - Alle Tips</h1>
  <div class="subtitle">Geexporteerd op ${new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</div>

  ${alwaysRelevant.length ? `
    <h2>⭐ Altijd relevant (${alwaysRelevant.length})</h2>
    ${alwaysRelevant.map(tipToHTML).join('')}
  ` : ''}

  ${sortedYears.map((y) => `
    <h2>${y === 'overig' ? '📋 Overig' : `📅 Jaar ${y}`} (${grouped[y].length})</h2>
    ${grouped[y].map(tipToHTML).join('')}
  `).join('')}
</body>
</html>`

      const printWindow = window.open('', '_blank')
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }

      setExported('print')
      setTimeout(() => setExported(null), 3000)
    } catch (err) {
      alert('Er ging iets mis: ' + err.message)
    }
    setExporting(false)
  }

  return (
    <div className="p-4 pb-8 max-w-lg mx-auto">
      <h1 className="font-serif font-bold text-2xl text-stone-800 mb-1">Instellingen</h1>
      <p className="text-stone-500 text-sm mb-6">Beheer je data en exporteer je tips.</p>

      {/* Export sectie */}
      <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
        <h2 className="font-bold text-stone-700 text-base flex items-center gap-2">
          📦 Data exporteren
        </h2>
        <p className="text-stone-500 text-sm">
          Maak een backup van al je tips en kalenderitems.
        </p>

        {/* Print naar PDF */}
        <button
          onClick={exportPrint}
          disabled={exporting}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all text-left group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            {exported === 'print' ? <CheckCircle className="w-5 h-5" /> : <Printer className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="font-bold text-purple-700 text-sm">Print naar PDF</div>
            <div className="text-purple-500 text-xs">Leesbaar document met alle tips per jaar</div>
          </div>
        </button>

        {/* JSON backup */}
        <button
          onClick={exportJSON}
          disabled={exporting}
          className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all text-left group disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            {exported === 'json' ? <CheckCircle className="w-5 h-5" /> : <Download className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="font-bold text-green-700 text-sm">Download JSON backup</div>
            <div className="text-green-500 text-xs">Alle data als bestand (tips + kalender)</div>
          </div>
        </button>

        {exporting && (
          <div className="flex items-center justify-center gap-2 text-sm text-stone-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Bezig met exporteren...
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-white/60 rounded-2xl p-4 border border-stone-100">
        <p className="text-xs text-stone-400 leading-relaxed">
          💡 Je data staat veilig in Supabase. Zelfs als de website offline gaat, blijven je tips bewaard in de database. Deze export is een extra vangnet.
        </p>
      </div>
    </div>
  )
}
