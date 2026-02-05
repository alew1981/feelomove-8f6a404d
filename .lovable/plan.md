

## 📋 Plan: Implementación de 3 Capas para Eliminar 974 Páginas Huérfanas

### 🎯 Objetivo Final
Asegurar que los crawlers de Ahrefs descubran enlaces a eventos ANTES de que React se hidrate, eliminando el problema de páginas huérfanas mediante enlazado pre-React con rotación horaria.

---

## Capa 1: Edge Function con Randomización Horaria

**Archivo**: `supabase/functions/popular-events/index.ts`

**Lógica Core**:
- Query a `mv_concerts_cards` con offset dinámico basado en la hora actual
- Cada hora devuelve 20 eventos diferentes (rotación automática)
- Formula: `offset = (hora_actual % total_eventos_dividido_20) * 20`
- Response en JSON: `[{ slug, artist_name, name }, ...]`
- Headers: `Cache-Control: public, max-age=3600` para caché CDN
- CORS headers para acceso desde `index.html`
- Manejo de errores graceful (si falla, retorna 500 silenciosamente)

**Timing**: 
- Executes en <100ms (caché CDN hit)
- Before Ahrefs completes HTML parse

**Archivo**: `supabase/functions/popular-events/deno.json`

**Contenido**:
- Imports con `npm:` specifier (igual que sitemap)
- Especificar `@supabase/supabase-js` version 2

---

## Capa 2: Script Inline Pre-React en index.html

**Ubicación**: Insertar ANTES de `<script type="module" src="/src/main.tsx">` (line 166)

**Lógica**:
- IIFE que ejecuta inmediatamente cuando HTML se parsea
- Fetch a `/functions/v1/popular-events` usando la URL completa del proyecto
- Crea `<ul id="seo-fallback-event-links">` dentro de `#seo-fallback`
- Itera sobre los 20 eventos y crea `<li><a href="/conciertos/${slug}">...</a></li>`
- Timeout de 5 segundos (si tarda más, se ignora gracefully)
- Manejo de errores: Si el fetch falla, el script no rompe nada

**Contenido del Script**:
```javascript
(function() {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 5000);
  
  fetch('https://wcyjuytpxxqailtixept.supabase.co/functions/v1/popular-events', {
    signal: abortController.signal
  })
    .then(r => r.json())
    .then(events => {
      clearTimeout(timeoutId);
      const fallback = document.getElementById('seo-fallback');
      if (!fallback) return;
      
      const ul = document.createElement('ul');
      ul.id = 'seo-fallback-event-links';
      ul.setAttribute('aria-label', 'Eventos populares');
      
      events.forEach(e => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `/conciertos/${e.slug}`;
        a.textContent = `Entradas ${e.artist_name || e.name}`;
        li.appendChild(a);
        ul.appendChild(li);
      });
      
      fallback.appendChild(ul);
    })
    .catch(() => clearTimeout(timeoutId));
})();
```

**Tamaño**: ~600 bytes (no afecta LCP)

---

## Capa 3: Optimizar SeoFallbackLinks.tsx

**Cambios**:
1. Agregar timeout de 500ms antes de hacer fetch post-React
2. Al inyectar enlaces contextuales, NO sobreescribir los globales
3. Append contexto-específico a `#seo-fallback-event-links` en lugar de reemplazar
4. Mantener la funcionalidad existente pero complementar, no reemplazar

**Beneficio**:
- Global links (20 eventos) → Disponibles antes de hidratación
- Contextual links (10-15 eventos del contexto) → Se agregan cuando React está listo
- Total crawleable: 30-35 enlaces por página

**Cambios específicos en el código**:
```typescript
// Agregar timeout antes de hacer fetch
useLayoutEffect(() => {
  const fetchTimeoutId = setTimeout(() => {
    // Lógica de fetch existente aquí
  }, 500);
  
  return () => clearTimeout(fetchTimeoutId);
}, [pageContext]);

// Al agregar eventos, hacer append en lugar de innerHTML = ''
if (linksContainer) {
  const newEvents = events.filter(e => {
    // Evitar duplicados checando slugs existentes
    const existing = Array.from(linksContainer.querySelectorAll('a'))
      .some(a => a.href.includes(e.slug));
    return !existing;
  });
  
  newEvents.forEach(event => {
    // Crear elemento y appendear
    const li = document.createElement('li');
    // ... resto del código ...
    linksContainer.appendChild(li);
  });
}
```

---

## 📁 Resumen de Archivos

| Archivo | Acción | Líneas | Descripción |
|---------|--------|--------|-------------|
| `supabase/functions/popular-events/index.ts` | **Crear** | ~80 | Edge Function con randomización |
| `supabase/functions/popular-events/deno.json` | **Crear** | ~10 | Dependencias Deno |
| `index.html` | **Editar** | 165-166 | Insertar script inline |
| `src/components/SeoFallbackLinks.tsx` | **Editar** | 69-147 | Agregar timeout + append en lugar de replace |

---

## 🔍 Verificación Técnica (Post-implementación)

**En `view-source` de cualquier página**:
1. Buscar `id="seo-fallback-event-links"`
2. Encontrar 20+ elementos `<a href="/conciertos/...">`
3. Los slugs deben ser diferentes cada hora (validar a las 13:00 y 14:00)

**Logs esperados**:
- Edge Function: ~100ms response time
- Script inline: Ejecuta antes de `<script type="module">`
- SeoFallbackLinks: Agrega enlaces contextuales después

---

## ✨ Beneficios Esperados

| Métrica | Impacto |
|---------|--------|
| Páginas huérfanas | 974 → ~0 (en 2-3 días de rastreo) |
| Enlaces en HTML inicial | 0 → 20 |
| Velocidad de descubrimiento | +240-480 eventos/24h (con rotación) |
| LCP impact | Neutral (<600 bytes JS) |
| Cache hits | 90%+ (CDN caché 1h) |

---

## 🚀 Orden de Implementación

1. Crear Edge Function + deno.json
2. Editar index.html (insertar script)
3. Editar SeoFallbackLinks.tsx (timeout + append)
4. Desplegar y verificar en view-source

