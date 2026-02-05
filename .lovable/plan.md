
# Plan: Corrección del sistema de enrutamiento para artistas y eventos

## Problema Identificado

El componente `ArtistaDetalle` no funciona porque espera un parámetro de ruta llamado `artistSlug`, pero la nueva ruta `/conciertos/:slug` define el parámetro como `slug`. Cuando `ConciertosSlugRouter` renderiza `ArtistaDetalle`, el hook `useParams()` devuelve `undefined` para `artistSlug`.

```text
Flujo actual (ROTO):
/conciertos/hombres-g
    ↓
ConciertosSlugRouter (lee :slug = "hombres-g")
    ↓
ArtistaDetalle (busca :artistSlug → undefined)
    ↓
No encuentra eventos → Redirige a 404
```

## Solución Propuesta

Modificar los componentes para que el slug se pase como prop, eliminando la dependencia del nombre específico del parámetro de ruta.

### Cambios Necesarios

---

### 1. Modificar `ConciertosSlugRouter.tsx`

Pasar el slug como prop a los componentes hijos:

```typescript
export default function ConciertosSlugRouter() {
  const { slug } = useParams<{ slug: string }>();
  
  // ... lógica existente de verificación ...

  if (existsAsEvent) {
    return <Producto slugProp={slug} />;
  }

  return <ArtistaDetalle slugProp={slug} />;
}
```

---

### 2. Modificar `ArtistaDetalle.tsx`

Aceptar el slug como prop opcional, con fallback al parámetro de ruta:

```typescript
interface ArtistaDetalleProps {
  slugProp?: string;
}

const ArtistaDetalle = ({ slugProp }: ArtistaDetalleProps) => {
  const params = useParams<{ artistSlug?: string; slug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Prioridad: prop > :slug > :artistSlug (compatibilidad)
  const rawSlug = slugProp 
    || params.slug 
    || params.artistSlug 
    || "";
  const artistSlug = rawSlug ? decodeURIComponent(rawSlug).replace(/-+/g, '-') : "";
  
  // ... resto del componente sin cambios ...
};
```

---

### 3. Modificar `Breadcrumbs.tsx`

Actualizar la lógica de obtención del slug de artista para soportar ambos nombres de parámetro:

```typescript
// Soportar tanto :slug como :artistSlug
const artistSlugRaw = pathnames[0] === "conciertos" && pathnames.length === 2 
  ? (params.slug || params.artistSlug) 
    ? decodeURIComponent(params.slug || params.artistSlug || "") 
    : null
  : null;
```

---

### 4. Verificar `Producto.tsx`

Asegurar que también pueda recibir el slug como prop (para consistencia, aunque ya funciona porque usa `slug`):

```typescript
interface ProductoProps {
  slugProp?: string;
}

const Producto = ({ slugProp }: ProductoProps) => {
  const { slug: routeSlug } = useParams();
  const slug = slugProp || routeSlug;
  // ... resto sin cambios ...
};
```

---

## Resultado Esperado

```text
Flujo corregido:
/conciertos/hombres-g
    ↓
ConciertosSlugRouter (lee :slug = "hombres-g")
    ↓
Verifica en DB: ¿existe como evento? NO
    ↓
ArtistaDetalle (recibe slugProp = "hombres-g")
    ↓
Busca eventos del artista "Hombres G"
    ↓
Muestra página de artista correctamente

/conciertos/hard-gz-bilbao
    ↓
ConciertosSlugRouter (lee :slug = "hard-gz-bilbao")
    ↓
Verifica en DB: ¿existe como evento? SÍ
    ↓
Producto (recibe slugProp = "hard-gz-bilbao")
    ↓
Muestra página de evento correctamente
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/ConciertosSlugRouter.tsx` | Pasar `slug` como prop a componentes hijos |
| `src/pages/ArtistaDetalle.tsx` | Aceptar `slugProp`, fallback a params |
| `src/pages/Producto.tsx` | Aceptar `slugProp` opcional |
| `src/components/Breadcrumbs.tsx` | Leer `slug` o `artistSlug` de params |

---

## Sección Técnica

### Compatibilidad con rutas existentes

La solución mantiene compatibilidad hacia atrás:
- Rutas legacy que usen `:artistSlug` seguirán funcionando
- El nuevo router unificado pasará el slug como prop
- No se rompen enlaces existentes

### Orden de prioridad para obtener el slug

```typescript
const effectiveSlug = slugProp || params.slug || params.artistSlug || "";
```

Esto asegura que:
1. Si viene como prop (desde ConciertosSlugRouter), lo usa
2. Si la ruta define `:slug`, lo usa
3. Si la ruta define `:artistSlug` (legacy), lo usa
4. Fallback a string vacío (manejado como error más adelante)
