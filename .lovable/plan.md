

# Fix 3 Critical SEO Issues for /en/ Pages

## Problem
All `/en/` event pages have their canonical, JSON-LD `@id`/`url`, and internal links hardcoded to Spanish URLs. This tells Google the EN pages are duplicates of the ES pages, blocking EN indexing entirely.

## Changes

### Fix 1 -- Self-referencing canonical for /en/ pages

**File: `src/lib/eventUtils.ts`** (line 75-79)

Update `getCanonicalEventUrl` to accept an optional `locale` parameter:

```ts
export const getCanonicalEventUrl = (slug: string, isFestival?: boolean | null, locale?: 'es' | 'en'): string => {
  const baseUrl = 'https://feelomove.com';
  if (locale === 'en') {
    const path = isFestival ? 'festivals' : 'tickets';
    return `${baseUrl}/en/${path}/${slug}`;
  }
  const path = isFestival ? 'festivales' : 'conciertos';
  return `${baseUrl}/${path}/${slug}`;
};
```

**File: `src/pages/Producto.tsx`** (line 942)

Pass the current locale to the function:

```ts
const absoluteUrl = getCanonicalEventUrl(canonicalSlug, eventDetails.is_festival || false, locale);
```

This single change fixes both the canonical tag (passed to `SEOHead` as `canonical={absoluteUrl}`) and the JSON-LD `@id`/`url` fields (passed to `EventSeo` via `createEventSeoProps` as `url: absoluteUrl`).

### Fix 2 -- JSON-LD @id and url (automatically fixed)

No separate change needed. The `absoluteUrl` from Fix 1 flows into `createEventSeoProps({ url: absoluteUrl })` which sets the `url` prop on `EventSeo`. Inside `EventSeo.tsx` (line 310), `@id: absoluteUrl` and `url: absoluteUrl` already use this value. Once Fix 1 passes the EN URL, Schema.org will show the correct English URL.

### Fix 3 -- Locale-aware links in SeoFallbackLinks and RelatedEventsSection

**File: `src/components/SeoFallbackLinks.tsx`** (lines 44-50, 132-153)

- Detect locale from `location.pathname` (check if starts with `/en/`)
- Use `/en/tickets/` and `/en/festivals/` prefixes when on EN routes
- Change link text from "Entradas" to "Tickets" for EN routes
- Update the slug extraction regex to also match `/en/tickets/` and `/en/festivals/` paths

**File: `src/components/RelatedEventsSection.tsx`** (lines 167-235)

- Add locale detection from `useLocation()` (check if pathname starts with `/en/`)
- Change the section title from "También te puede interesar" to "You might also like" for EN
- Change "Ver todos" link to "See all" and point to `/en/tickets` instead of `/conciertos`
- Change event URLs from `/conciertos/[slug]` to `/en/tickets/[slug]` and `/festivales/[slug]` to `/en/festivals/[slug]`
- Change skeleton placeholder links to use EN paths and text

---

## Files to modify

| File | What changes |
|------|-------------|
| `src/lib/eventUtils.ts` | Add `locale` param to `getCanonicalEventUrl` |
| `src/pages/Producto.tsx` | Pass `locale` to `getCanonicalEventUrl` |
| `src/components/SeoFallbackLinks.tsx` | Use EN prefixes and text on `/en/` routes |
| `src/components/RelatedEventsSection.tsx` | Use EN URLs, title, and link text on `/en/` routes |

## Verification
After deploying, `curl -s https://feelomove.com/en/tickets/the-kooks-barcelona | grep canonical` should show `href="https://feelomove.com/en/tickets/the-kooks-barcelona"` (not `/conciertos/`).

