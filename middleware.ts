import { next } from '@vercel/edge'

const SUPABASE_META = 'https://wcyjuytpxxqailtixept.supabase.co/rest/v1/mv_events_meta_tags'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function setMetaContent(html: string, attrSelector: string, value: string): string {
  if (!value) return html
  const v = esc(value)
  const r1 = new RegExp(`(<meta[^>]*${attrSelector}[^>]*\\bcontent=")[^"]*("(?:[^>]*)?>)`, 'i')
  const r2 = new RegExp(`(<meta[^>]*\\bcontent=")[^"]*("[^>]*${attrSelector}[^>]*>)`, 'i')
  if (r1.test(html)) return html.replace(r1, `$1${v}$2`)
  if (r2.test(html)) return html.replace(r2, `$1${v}$2`)
  return html
}

interface MetaRow {
  og_title?: string
  og_description?: string
  meta_description?: string
  og_image?: string
  og_url?: string
  canonical_url?: string
}

export const config = {
  matcher: ['/conciertos/:path*', '/festivales/:path*'],
}

export default async function middleware(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)
  const parts = pathname.split('/').filter(Boolean)
  const slug = parts[parts.length - 1]
  if (!slug) return next()

  const apiKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!apiKey) return next()

  try {
    const metaUrl = `${SUPABASE_META}?slug=eq.${encodeURIComponent(slug)}&select=og_title,og_description,meta_description,og_image,og_url,canonical_url`

    const [metaRes, htmlRes] = await Promise.all([
      fetch(metaUrl, { headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` } }),
      fetch(new URL('/', request.url).toString()),
    ])

    if (!metaRes.ok || !htmlRes.ok) return next()

    const [rows, html]: [MetaRow[], string] = await Promise.all([metaRes.json(), htmlRes.text()])
    const meta = rows[0]
    if (!meta) return next()

    const title = meta.og_title ?? ''
    const description = meta.meta_description ?? meta.og_description ?? ''
    const ogDesc = meta.og_description ?? description
    const image = meta.og_image ?? ''
    const canonical = meta.canonical_url ?? meta.og_url ?? ''

    let doc = html
    if (title) {
      doc = doc.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)}</title>`)
      doc = setMetaContent(doc, 'property="og:title"', title)
      doc = setMetaContent(doc, 'name="twitter:title"', title)
    }
    if (description) doc = setMetaContent(doc, 'name="description"', description)
    if (ogDesc) {
      doc = setMetaContent(doc, 'property="og:description"', ogDesc)
      doc = setMetaContent(doc, 'name="twitter:description"', ogDesc)
    }
    if (image) {
      doc = setMetaContent(doc, 'property="og:image"', image)
      doc = setMetaContent(doc, 'name="twitter:image"', image)
    }
    if (canonical) {
      doc = doc.replace(/(<link[^>]*rel="canonical"[^>]*href=")[^"]*(")/i, `$1${esc(canonical)}$2`)
      doc = setMetaContent(doc, 'property="og:url"', canonical)
    }

    const headers = new Headers(htmlRes.headers)
    headers.set('x-seo-injected', '1')
    headers.set('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    headers.delete('content-encoding')
    return new Response(doc, { status: 200, headers })
  } catch {
    return next()
  }
}
