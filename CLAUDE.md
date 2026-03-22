# ParentLog - Opvoedtips App

## Project overzicht

Een persoonlijke web-app om opvoedtips bij te houden, georganiseerd per levensjaar en categorie. Tips kunnen tekst, YouTube-video's en podcast-afleveringen zijn. De app werkt als PWA (Progressive Web App), zodat hij ook op iOS als app op het homescreen gezet kan worden.

---

## Tech stack

| Onderdeel     | Keuze                    | Reden                                      |
|---------------|--------------------------|--------------------------------------------|
| Frontend      | React + Vite             | Snel, modern, goed ondersteund             |
| Styling       | Tailwind CSS             | Utility-first, goed voor responsive design |
| Backend/DB    | Supabase                 | Gratis tier, inclusief auth en database    |
| Hosting       | Vercel                   | Gratis, automatisch via GitHub             |
| PWA           | vite-plugin-pwa          | Installeerbaar op iOS via Safari           |
| Icons         | Lucide React             | Lichtgewicht iconset                       |

---

## Installatie & setup

### 1. Project aanmaken

```bash
npm create vite@latest parentlog -- --template react
cd parentlog
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @supabase/supabase-js
npm install lucide-react
npm install vite-plugin-pwa -D
```

### 2. Supabase project

1. Ga naar https://supabase.com en maak een gratis account aan
2. Maak een nieuw project aan, noteer de `Project URL` en `anon public` API key
3. Maak een `.env` bestand in de root van het project:

```env
VITE_SUPABASE_URL=jouw_project_url
VITE_SUPABASE_ANON_KEY=jouw_anon_key
```

### 3. Database schema

Voer de volgende SQL uit in de Supabase SQL editor:

```sql
-- Tips tabel
create table tips (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  note text,
  type text not null check (type in ('text', 'youtube', 'podcast')),
  url text,
  thumbnail_url text,
  years int[] not null default '{}',
  always_relevant boolean not null default false,
  categories text[] not null default '{}',
  source_label text,
  proven boolean not null default false
);

-- Row Level Security uitschakelen voor v1 (single user)
alter table tips enable row level security;
create policy "Allow all" on tips for all using (true);
```

---

## Applicatiestructuur

```
src/
  components/
    Layout.jsx          # Navigatie + pagewrapper
    TipCard.jsx         # Kaart voor een enkele tip
    TipForm.jsx         # Formulier voor toevoegen/bewerken tip
    YearNav.jsx         # Navigatiebalk voor jaren (0-18 + Altijd)
    CategoryFilter.jsx  # Filterknopjes per categorie
    YoutubeEmbed.jsx    # Embedded YouTube player
    EmptyState.jsx      # Lege staat per jaar/categorie
  pages/
    Home.jsx            # Tijdlijn overzicht (jaar-navigatie)
    TipDetail.jsx       # Detailpagina van een tip
    AddTip.jsx          # Pagina voor nieuwe tip toevoegen
  lib/
    supabase.js         # Supabase client initialisatie
    helpers.js          # Hulpfuncties (YouTube ID extractor etc.)
  constants/
    categories.js       # Lijst van alle categorieen
    years.js            # Jaar definities (0-18 + altijd)
  App.jsx
  main.jsx
```

---

## Functionaliteiten (v1)

### Tijdlijn navigatie

- Horizontaal scrollbare balk met jaren: "Altijd", 0, 1, 2, ... 18
- Actief jaar is gehighlight
- Elk jaar toont het aantal opgeslagen tips als badge
- "Altijd relevant" tips verschijnen bovenaan elk geselecteerd jaar

### Categorieen

De volgende categorieen zijn standaard beschikbaar:

- Slaap
- Voeding
- Taal & ontwikkeling
- Spel & stimulatie
- Gedrag & grenzen
- Gezondheid
- Veiligheid
- School & leren
- Emoties & gehechtheid

Categorieen worden weergegeven als filterknopjes. Meerdere tegelijk selecteren is mogelijk.

### Tip kaart (TipCard)

Elke tip bevat:

- **Titel** (verplicht)
- **Type badge**: tekst, YouTube of podcast
- **Thumbnail**: automatisch opgehaald van YouTube via `https://img.youtube.com/vi/{VIDEO_ID}/mqdefault.jpg`
- **Persoonlijke notitie**: jouw eigen context of samenvatting
- **Bron label**: bijv. "Boek: Het Explosieve Kind" of "Podcast: De Geboorteclub"
- **Jaar-tags**: de jaren waarvoor de tip van toepassing is
- **Altijd relevant** toggle
- **Bewezen markering**: groen vinkje als de tip daadwerkelijk werkt voor jouw dochter

### Tip toevoegen (TipForm)

- URL-veld: detecteert automatisch of het YouTube, Spotify of een andere link is
- YouTube: haalt automatisch thumbnail en video-titel op via oEmbed API (`https://www.youtube.com/oembed?url={URL}&format=json`)
- Podcast: toont als audio-link die in de browser afspeelt
- Jaar selectie: meerdere jaren aanvinken, of "Altijd relevant" toggling
- Categorie selectie: meerdere categorieen aanvinken
- Notitieveld: markdown-achtige opmaak is prima als plain text

### YouTube afspelen

Gebruik een embedded iframe binnen de app zodat video's direct afspelen zonder de app te verlaten:

```jsx
<iframe
  src={`https://www.youtube.com/embed/${videoId}`}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

---

## Supabase client (src/lib/supabase.js)

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

## Helperfuncties (src/lib/helpers.js)

```js
// Haal YouTube video ID op uit een URL
export function getYoutubeId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Detecteer type op basis van URL
export function detectType(url) {
  if (!url) return 'text'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('spotify.com') || url.includes('podcasts.apple.com')) return 'podcast'
  return 'text'
}

// Haal YouTube metadata op via oEmbed
export async function fetchYoutubeMetadata(url) {
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
  if (!res.ok) return null
  return res.json() // bevat .title en .thumbnail_url
}
```

---

## Datamodel (TypeScript-stijl definitie ter referentie)

```ts
interface Tip {
  id: string
  created_at: string
  title: string
  note: string | null
  type: 'text' | 'youtube' | 'podcast'
  url: string | null
  thumbnail_url: string | null
  years: number[]             // bijv. [0, 1, 2] of [] als always_relevant
  always_relevant: boolean
  categories: string[]        // bijv. ['Slaap', 'Gezondheid']
  source_label: string | null // bijv. "YouTube: SpinaCMS"
  proven: boolean
}
```

---

## Design richting

- **Stijl**: Warm, rustig en persoonlijk. Denk aan een digitaal notitieboek, niet aan een klinische app.
- **Kleurenpalet**: Zachte aardetinten. Suggestie: creme achtergrond (#FDFAF5), donkergroen als primaire kleur (#2D5A3D), terracotta als accent (#C4623A).
- **Typografie**: Gebruik een serif font voor titels (bijv. Lora of Playfair Display via Google Fonts) en een schoon sans-serif voor bodytekst (bijv. DM Sans).
- **Cards**: Lichte schaduw, afgeronde hoeken, thumbnail links als er een video is.
- **Jaar navigatie**: Scrollbare chip-stijl balk bovenaan, actief jaar heeft een donkere achtergrond.
- **Categorie filters**: Kleine pill-buttons, multiselect, geselecteerde categorie heeft een gekleurde rand.
- **Mobile-first**: De app wordt primair op telefoon gebruikt. Alles moet comfortabel met een duim te bedienen zijn.

---

## PWA configuratie (vite.config.js)

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'ParentLog',
        short_name: 'ParentLog',
        description: 'Jouw persoonlijke opvoedtips bibliotheek',
        theme_color: '#2D5A3D',
        background_color: '#FDFAF5',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

Voeg twee PNG-icoontjes toe in de `public/` map: `icon-192.png` en `icon-512.png`. Op iOS verschijnt de app dan als icoon op het homescreen wanneer je hem toevoegt via Safari > Delen > Zet op beginscherm.

---

## Deployment via Vercel

1. Push het project naar GitHub
2. Ga naar https://vercel.com en koppel je GitHub repo
3. Voeg de environment variables toe in de Vercel projectinstellingen:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Elke push naar `main` deployt automatisch.

---

## Bouwvolgorde (aanbevolen)

Bouw de app in deze volgorde zodat je vroeg iets werkends hebt:

1. Supabase project aanmaken en database schema uitvoeren
2. Vite + React project opzetten met Tailwind
3. Supabase client verbinden en een test-tip handmatig toevoegen via SQL
4. `Home.jsx` bouwen met jaar-navigatie en lijst van tips per jaar
5. `TipCard.jsx` component bouwen
6. `TipForm.jsx` bouwen inclusief URL-detectie en YouTube metadata ophalen
7. Routing toevoegen tussen Home, AddTip en TipDetail
8. Categorie filters implementeren
9. "Altijd relevant" logica implementeren (tips bovenaan elk jaar tonen)
10. PWA configureren en testen op iPhone via Safari
11. Deployen naar Vercel

---

## Toekomstige uitbreidingen (v2)

- Familieleden uitnodigen via e-mail (Supabase Auth + Row Level Security per gezin)
- Reminder-notificaties: "Je dochter wordt binnenkort 2, dit zijn tips die je hebt bewaard voor dat jaar"
- Importeren van tips via URL (automatisch scrapen van titel en thumbnail)
- Zoekfunctie over alle tips heen
- Tags naast categorieen voor fijnere indeling
- Export als PDF per jaar
