

## Plan: Sold Out Badge + "Ver otros conciertos" Section

### Resumen
Cuando un evento no tiene entradas disponibles (todos agotados o sin datos de tickets), se mostrara:
1. Un badge "AGOTADO" visible en el bloque de entradas
2. Una seccion de pills (estilo "Ver en otros destinos") mostrando las otras ciudades donde toca el artista, con titulo "Ver otros conciertos de [Artista]" y enlace "Ver todos" que lleva a la pagina del artista

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Producto.tsx` | Agregar badge AGOTADO + seccion de otros conciertos cuando no hay disponibilidad |

---

### Cambio 1: Badge "AGOTADO" en la seccion de entradas

Cuando `!isEventAvailable` (todas las entradas agotadas o sin ticket_types), mostrar un badge "AGOTADO" prominente encima del listado de tickets (o en lugar de la seccion vacia).

**Logica de deteccion sold out:**
- `ticketPrices.length === 0` (sin datos de tickets, como HUMBE)
- `ticketPrices.length > 0 && !hasAvailableTickets` (todos con availability "none", como Caifanes/BTS)
- En ambos casos: `!isEventAvailable` es true

**Ubicacion:** Justo antes del bloque de tickets (linea ~1240), agregar un condicional:

```tsx
{/* Seccion de entradas */}
{!isEventAvailable && !isNotYetOnSale && (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-muted text-muted-foreground">1</div>
      <h2 className="text-xl sm:text-2xl font-bold">Entradas</h2>
    </div>
    <Card className="border-2 border-muted">
      <CardContent className="p-6 text-center space-y-3">
        <Badge variant="agotado" className="text-sm px-4 py-1.5">AGOTADO</Badge>
        <p className="text-sm text-muted-foreground">
          Las entradas para este evento se han agotado
        </p>
      </CardContent>
    </Card>
  </div>
)}
```

Esto se mostrara ANTES del bloque `ticketPrices.length > 0 && (...)` existente, y ese bloque seguira mostrando tickets individuales (con opacity reducida) si los hay.

---

### Cambio 2: Seccion "Ver otros conciertos de [Artista]" cuando sold out

**Ubicacion:** Despues del bloque de entradas agotadas y ANTES de la seccion de hoteles (linea ~1379).

Reutilizar los datos de `artistOtherCities` que ya se obtienen en la query existente (linea 440-505). La seccion usa el mismo diseno de pills que `ArtistDestinationsList` pero con:

- Titulo: "Ver otros conciertos de [artistName]" (con icono de ticket en vez de pin)
- "Ver todos" enlaza a `/artista/[artist-slug]`
- Cada pill enlaza a `/destinos/[city-slug]` (igual que ahora)

```tsx
{/* Seccion "Ver otros conciertos" - Solo cuando agotado */}
{!isEventAvailable && !isNotYetOnSale && artistOtherCities && artistOtherCities.length > 0 && (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <IconTicket className="h-5 w-5 text-accent" />
        Ver otros conciertos de {mainArtist}
      </h2>
      <Link
        to={`/artista/${mainArtist.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
        className="flex items-center gap-1 text-accent hover:text-accent/80 font-semibold transition-colors text-sm"
      >
        Ver todos <IconChevronRight />
      </Link>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible scrollbar-hide">
      {artistOtherCities.map((city) => (
        <Link key={city.slug} to={`/destinos/${city.slug}`}
          className="group inline-flex items-center gap-2 px-4 py-2.5 bg-card border-2 border-foreground rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 ease-out hover:bg-[#00FF8F] hover:-translate-y-1"
        >
          <span className="font-semibold text-sm text-foreground group-hover:text-black transition-colors duration-200">
            {city.name}
          </span>
          <span className="text-xs font-bold bg-foreground text-background px-2 py-0.5 rounded-full group-hover:bg-black group-hover:text-[#00FF8F] transition-colors duration-200">
            {city.count}
          </span>
        </Link>
      ))}
    </div>
  </section>
)}
```

---

### Cambio 3: Sidebar "Tu Pack" - Estado sold out

En el sidebar desktop (linea 1553-1562), cuando el evento esta agotado, mostrar mensaje adecuado en vez de "Empieza seleccionando tus entradas":

```tsx
{/* Estado vacio del sidebar */}
<div className="text-center py-8">
  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
    <IconTicket className="h-6 w-6 text-muted-foreground" />
  </div>
  {!isEventAvailable && !isNotYetOnSale ? (
    <>
      <Badge variant="agotado" className="mb-2">AGOTADO</Badge>
      <p className="text-xs text-muted-foreground">
        Las entradas para este evento se han agotado
      </p>
    </>
  ) : (
    <>
      <p className="text-foreground font-medium mb-2">Empieza seleccionando tus entradas</p>
      <p className="text-xs text-muted-foreground">
        Elige las entradas y despues anade un hotel para completar tu pack
      </p>
    </>
  )}
</div>
```

---

### Flujo Visual (Evento Agotado)

```text
+------------------------------------------+
|  [1] Entradas                            |
|  ┌────────────────────────────────────┐  |
|  |         [ AGOTADO ]                |  |
|  |  Las entradas se han agotado       |  |
|  └────────────────────────────────────┘  |
|                                          |
|  🎫 Ver otros conciertos de Caifanes     |
|                                 Ver todos|
|  [Barcelona 1] [Madrid 2] [Sevilla 1]   |
|                                          |
|  [2] Hoteles cerca del evento            |
|  ...                                     |
+------------------------------------------+
```

---

### Resumen de Archivos

- `src/pages/Producto.tsx`: 3 cambios (badge agotado, seccion pills, sidebar)
- No se necesitan iconos SVG nuevos (IconTicket y IconChevronRight ya existen inline en el archivo)
- No se necesitan queries adicionales (reutiliza `artistOtherCities`)

