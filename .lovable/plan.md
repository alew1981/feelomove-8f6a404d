

## Rediseno de la seccion de entradas (TicketSelector)

### Resumen
Crear un componente `TicketSelector` reutilizable con el diseno del mockup y reemplazar el bloque actual de tickets en `Producto.tsx`.

### Cambios visuales respecto al diseno actual

| Aspecto | Actual | Nuevo (mockup) |
|---------|--------|----------------|
| Titulo | Numero en circulo + "Selecciona tus entradas" | Check verde en circulo + titulo + contador a la derecha ("1 entrada") |
| Subtitulo | Texto pequeno debajo | Texto verde con check: "Entradas anadidas! Ahora elige tu alojamiento" |
| Layout tarjeta | Badge arriba-izq, nombre, precio y +/- a la derecha en vertical | Nombre arriba-izq, badge DISPONIBLE/AGOTADO arriba-derecha, precio grande abajo-izq con "/ud" y gastos, +/- abajo-derecha |
| Tarjeta seleccionada | Borde accent | Borde verde + check verde arriba-izq de la tarjeta |
| Tarjeta agotada | Opacity 60% | Texto y controles grises, badge AGOTADO gris, botones deshabilitados |
| Boton "Ver mas" | Boton outline | Texto "VER X MAS" con chevron, centrado |

### Archivos

| Archivo | Accion |
|---------|--------|
| `src/components/TicketSelector.tsx` | **Crear** - Componente nuevo con toda la logica visual |
| `src/pages/Producto.tsx` | **Modificar** - Reemplazar el bloque de tickets (lineas ~1273-1401) por `<TicketSelector />` |

---

### Componente TicketSelector

**Props:**
```
interface TicketOption {
  id: string;
  name: string;        // tipo de entrada (AR, GENERAL, VR)
  description?: string; // nombre completo
  price: number;
  fees: number;
  status: "available" | "limited" | "sold-out";
  isVip?: boolean;
}

interface TicketSelectorProps {
  title?: string;            // default "Selecciona tus entradas"
  subtitle?: string;         // texto cuando hay entradas seleccionadas
  tickets: TicketOption[];
  quantities: Record<string, number>;  // estado actual de cantidades
  onQuantityChange: (id: string, delta: number) => void;
  maxPerTicket?: number;     // default 10
  initialVisible?: number;   // default 4, para "Ver mas"
}
```

**Estructura visual de cada tarjeta:**
```
+----------------------------------------------------+
| [check]  Nombre completo (TIPO)      [DISPONIBLE]  |
|                                                     |
|   E38 /ud                          [ - ] 1 [ + ]   |
|   + E5.00 gastos                                    |
+----------------------------------------------------+
```

- Tarjeta con `quantity > 0`: borde verde (`border-accent`), icono check verde flotando arriba-izquierda
- Tarjeta `sold-out`: todo en gris (texto `text-muted-foreground`), badge AGOTADO gris, botones deshabilitados con opacidad reducida
- Tarjeta `limited`: badge ULTIMAS (naranja/amber)
- Tarjeta disponible sin seleccion: borde neutro, hover sutil

**Header de la seccion:**
- Izquierda: circulo con numero "1" (sin seleccion) o check verde (con seleccion) + titulo
- Derecha: contador "X entrada(s)" en color accent cuando hay seleccion
- Debajo del titulo: subtitulo verde con check cuando `completed`

**Boton "Ver mas":**
- Texto centrado "VER X MAS" con chevron hacia abajo (o arriba si expandido)
- Estilo texto, no boton outline

---

### Cambios en Producto.tsx

1. Importar `TicketSelector`
2. Reemplazar el bloque entre lineas ~1273-1401 por:

```tsx
{ticketPrices.length > 0 && (
  <TicketSelector
    tickets={ticketPrices.map((t: any) => ({
      id: t.id,
      name: t.type,
      description: t.description,
      price: t.price,
      fees: t.fees,
      status: t.availability === "none" ? "sold-out" 
             : t.availability === "limited" ? "limited" 
             : "available",
      isVip: /vip/i.test(t.type || "") || /vip/i.test(t.description || "") || /vip/i.test(t.code || ""),
    }))}
    quantities={ticketPrices.reduce((acc: Record<string, number>, t: any) => {
      acc[t.id] = getTicketQuantity(t.id);
      return acc;
    }, {})}
    onQuantityChange={(id, delta) => handleTicketQuantityChange(id, delta)}
    completed={isEventInCart && totalPersons > 0}
  />
)}
```

Esto mantiene toda la logica de negocio (handleTicketQuantityChange, getTicketQuantity, cart) en Producto.tsx y delega solo la presentacion al nuevo componente.

