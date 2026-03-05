

## Plan: User Auth, Private Area & Synced Favorites

### Overview
Implement Supabase Auth (email+password), a private account page, and upgrade the favorites system to sync with the `subscribers` table when authenticated. The footer newsletter is already implemented.

### Database Changes

**Migration**: Add RLS policy for authenticated users to read/update their own subscriber record:

```sql
-- Allow authenticated users to read their own subscriber record
CREATE POLICY "Users can read own subscriber"
ON public.subscribers FOR SELECT TO authenticated
USING (auth_user_id = auth.uid());

-- Existing UPDATE policy already allows updates (uses `true` for USING/WITH CHECK)
-- but we should tighten it for authenticated users if needed
```

No schema changes needed — `auth_user_id`, `favorite_event_ids`, `favorite_artist_ids`, `name`, `avatar_url` already exist on `subscribers`.

### Files to Create

**1. `src/contexts/AuthContext.tsx`** — Auth provider wrapping the app
- `useEffect` with `onAuthStateChange` listener (set up BEFORE `getSession`)
- Exposes: `user`, `session`, `loading`, `signUp`, `signIn`, `signOut`
- On sign-up success: upsert to `subscribers` with `auth_user_id`, `name`, `locale`, `consent_marketing`, `source: 'registro'`

**2. `src/pages/Auth.tsx`** — Login/Register page (`/login`, `/en/login`)
- Tabs: "Iniciar sesión" / "Registrarse"
- Register form: name, email, password, consent checkbox
- Login form: email, password
- Redirect to `/mi-cuenta` on success
- Already-authenticated users redirect away

**3. `src/pages/MiCuenta.tsx`** — Private area (`/mi-cuenta`, `/en/my-account`)
- Protected: redirect to `/login` if not authenticated
- Three sections:
  - **Mis datos**: name (editable), email (read-only), locale preference
  - **Mis favoritos**: grid of events from `favorite_event_ids` crossed with `lovable_mv_event_product_page` (or show empty state)
  - **Preferencias**: toggle for `consent_marketing`
- Save changes via `supabase.from('subscribers').update(...)` filtered by `auth_user_id`

### Files to Modify

**4. `src/hooks/useFavorites.tsx`** — Upgrade to hybrid localStorage + DB sync
- If user is authenticated: read `favorite_event_ids` from `subscribers` on mount, write toggles to both localStorage AND DB (`update` the array)
- If not authenticated: keep current localStorage-only behavior
- Import `useAuth` from AuthContext

**5. `src/components/Navbar.tsx`** — Add user icon/avatar
- If authenticated: show user avatar/icon linking to `/mi-cuenta`
- If not authenticated: show login icon linking to `/login`
- Keep existing favorites heart icon

**6. `src/App.tsx`** — Add routes and AuthProvider
- Wrap with `<AuthProvider>` inside `<LanguageProvider>`
- Add routes: `/login`, `/en/login`, `/mi-cuenta`, `/en/my-account`
- Lazy load Auth and MiCuenta pages

**7. `src/contexts/LanguageContext.tsx`** — Add ~15 new translations
- Auth form labels, account page headings, button text, empty states

**8. Event cards (EventCard, EventCardCompact, FestivalCard, Producto)** — Favorite heart behavior
- When not authenticated and user clicks heart: show toast "Inicia sesión para guardar favoritos" with link to `/login`
- When authenticated: existing toggle behavior + DB sync via updated `useFavorites`

### Architecture

```text
AuthContext (wraps app)
  ├── provides: user, session, signUp, signIn, signOut
  ├── onAuthStateChange listener
  └── on signUp → upsert subscribers

useFavorites (upgraded)
  ├── if auth: read/write favorite_event_ids from subscribers table
  └── if anon: localStorage only (current behavior)

Routes:
  /login ─────────── Auth.tsx (tabs: login/register)
  /en/login ──────── Auth.tsx
  /mi-cuenta ─────── MiCuenta.tsx (protected)
  /en/my-account ─── MiCuenta.tsx (protected)
```

### What stays unchanged
- Footer newsletter (already implemented)
- FooterNewsletter component (no changes)
- Event card visual design (only heart click behavior changes for anon users)
- All existing routes and pages

