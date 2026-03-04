

## Plan: Alternative Layout for Unavailable Events

### Overview
When an event is unavailable (sold out, off-sale, or cancelled), restructure the detail page to promote hotels as the primary CTA, show a prominent status badge, and update SEO metadata accordingly.

### 1. Add `isUnavailable` flag in Producto.tsx (~line 818)

Compute a single boolean after existing variables:

```typescript
const isUnavailable = 
  eventDetails.sold_out === true || 
  (eventDetails as any).seats_available === false || 
  (eventDetails as any).schedule_status === 'offsale' ||
  (eventDetails as any).schedule_status === 'soldout' ||
  eventDetails.cancelled === true;
```

Also compute a `unavailableReason` string (`'sold_out' | 'offsale' | 'cancelled'`) for badge selection.

### 2. Status Badge below title (lines ~1134-1148)

When `isUnavailable`, inject a prominent pill badge right after the title (both mobile and desktop sections):

- `sold_out` → red pill: "🔴 Entradas agotadas" / "🔴 Sold out"
- `offsale` → red pill: "🔴 Venta cerrada" / "🔴 Tickets unavailable"  
- `cancelled` → black pill: "⚫ Evento cancelado" / "⚫ Event cancelled"

Replace the price/CollapsibleBadges area in the hero with this badge.

### 3. Reorder main content grid (lines ~1327-1524)

When `isUnavailable`:

**A. Hotels block moves to first position** with intro copy:
- "¿Ya tienes tu entrada? Encuentra el hotel perfecto cerca de [venue_name]..."
- If no hotels: "Próximamente dispondremos de hoteles para este evento."
- Render the existing `HotelMapTabs` component as-is.

**B. Ticket status block moves below hotels** (existing IIFE at line 1331 stays but renders after hotels).

**C. Event info (ArtistDestinationsList, etc.) stays below.**

Implementation: wrap the two sections in a conditional that swaps their order using a simple `{isUnavailable ? <HotelsFirst /> : <TicketsFirst />}` pattern.

### 4. Sidebar "Tu Pack" (lines ~1526-1710)

When `isUnavailable` and cart is empty, show hotel-focused empty state instead of ticket-focused one:
- "Encuentra tu hotel" with hotel icon instead of ticket icon.

### 5. SEO Meta Tags (lines ~947-992)

When `isUnavailable`, override `seoTitle` and `seoDescription`:

**Title:**
- ES: `[Event] en [City] [Year] – Entradas Agotadas | FEELOMOVE`
- EN: `[Event] in [City] [Year] – Sold Out | FEELOMOVE`

**Description:**
- ES: `[Event] en [Venue], [City]. Las entradas están agotadas. ¿Ya tienes la tuya? Reserva hotel cerca del recinto desde [min_hotel_price]€.`
- EN: `[Event] at [Venue], [City]. Tickets are sold out. Already have yours? Book a hotel near the venue from [min_hotel_price]€.`

Use `hotels[0]?.selling_price` for min hotel price if available, omit price part if not.

### 6. Schema.org JSON-LD (EventSeo.tsx)

Update `getSchemaEventStatus` function to handle `schedule_status` values. In `createEventSeoProps`, add `seats_available` and `schedule_status` to the input type, and use them to compute `eventStatus`:

```typescript
if (event.cancelled) return 'https://schema.org/EventCancelled';
if (event.sold_out || event.schedule_status === 'soldout') return 'https://schema.org/EventSoldOut';
if (!event.seats_available || event.schedule_status === 'offsale') return 'https://schema.org/EventSoldOut';
return 'https://schema.org/EventScheduled';
```

### 7. Translations (LanguageContext.tsx)

Add ~10 new translation entries for the new copy strings (hotel-focused CTAs, status badges, etc.).

### Files Modified
- `src/pages/Producto.tsx` — main layout changes, SEO overrides, `isUnavailable` logic
- `src/components/EventSeo.tsx` — dynamic `eventStatus` in Schema.org
- `src/contexts/LanguageContext.tsx` — new translations

### What stays unchanged
- Events with `seats_available === true && sold_out === false && cancelled === false` render exactly as today
- FestivalDetalle.tsx is not touched (it uses a different component)
- EventCard badges, WaitlistForm, and all other components remain as-is

