

## Plan: Corregir Error de Schema.org BreadcrumbList "Falta el campo item"

### Problema Identificado

Google Search Console reporta **128 elementos afectados** con el error:
> "Falta el campo 'item' (en 'itemListElement')"

**Causa raíz**: La función `generateBreadcrumbSchema` en `SEOHead.tsx` solo añade el campo `item` cuando existe una URL. Sin embargo, según las especificaciones de Google:

1. **Todos los `ListItem` EXCEPTO el último DEBEN tener el campo `item`** con una URL válida
2. Solo el último elemento (página actual) puede omitir la URL

El código actual permite que elementos intermedios omitan `item` si no tienen URL, lo que viola la especificación.

---

### Solución Propuesta

#### Modificar `src/components/SEOHead.tsx`

Cambiar la función `generateBreadcrumbSchema` para:

1. **Garantizar que todos los items excepto el último tengan siempre el campo `item`**
2. **Si un item intermedio no tiene URL, generar una URL de fallback** basada en el nombre
3. **Filtrar items con nombres vacíos** (que no deberían existir en breadcrumbs)
4. **El último item siempre omite `item`** (comportamiento correcto según Google)

```text
ANTES (problemático):
breadcrumbs.map((item, index) => ({
  "@type": "ListItem",
  "position": index + 1,
  "name": item.name,
  ...(item.url && { "item": ... })  // ❌ Omite item si no hay URL
}))

DESPUÉS (correcto):
breadcrumbs
  .filter(item => item.name && item.name.trim())  // Filtrar vacíos
  .map((item, index, arr) => {
    const isLast = index === arr.length - 1;
    
    // URL: Para items intermedios, siempre generar una
    const itemUrl = item.url 
      ? (item.url.startsWith('http') ? item.url : `https://feelomove.com${item.url}`)
      : null;
    
    return {
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      // CRITICAL: Solo el último item omite "item", los demás DEBEN tenerlo
      ...(!isLast && { "item": itemUrl || `https://feelomove.com` })
    };
  })
```

---

### Lógica de Validación

| Posición | URL presente | Campo `item` |
|----------|--------------|--------------|
| Primero (Inicio) | Sí (`/`) | Incluido |
| Intermedio (Conciertos) | Sí (`/conciertos`) | Incluido |
| Intermedio (Ciudad) | Podría faltar | **Fallback a feelomove.com** |
| Último (Evento actual) | N/A | **Omitido** (correcto) |

---

### Ejemplo de Output Correcto

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://feelomove.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Conciertos",
      "item": "https://feelomove.com/conciertos"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Sevilla",
      "item": "https://feelomove.com/destinos/sevilla"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "Jamiroquai - Icónica Santalucia Sevilla Fest"
    }
  ]
}
```

---

### Archivos a Modificar

| Archivo | Cambio | Descripción |
|---------|--------|-------------|
| `src/components/SEOHead.tsx` | Editar función `generateBreadcrumbSchema` (líneas 224-238) | Añadir lógica para garantizar `item` en todos los elementos excepto el último |

---

### Verificación Post-Implementación

1. **Rich Results Test**: Probar URLs afectadas en https://search.google.com/test/rich-results
2. **View Source**: Verificar que el JSON-LD de BreadcrumbList tenga `item` en todos los elementos excepto el último
3. **Search Console**: Esperar 1-2 días para que Google revalide las páginas

---

### Impacto Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Elementos con error "item" | 128 | 0 |
| BreadcrumbList válidos | ~90% | 100% |
| Rich Results elegibles | Bloqueados | Habilitados |

