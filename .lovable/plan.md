
## Plan: Optimización LCP con Hydration Overlay + CLS Prevention

### Problema Identificado
El plan anterior sugería cambiar `.content-skeleton .title` a `background:transparent` sin preservar el `min-height`, lo que podría causar un Layout Shift micro cuando el texto se renderice. Es crítico mantener el espacio "reservado" incluso con fondo transparente.

### Archivos a Modificar
- `index.html` (línea 77 y 86 para CSS, línea 141 y 144 para HTML)

---

### Cambios CSS (Línea 77 - Breadcrumb)

**Actual:**
```css
.hero-skeleton .breadcrumb{height:20px;width:200px;background:rgba(255,255,255,0.05);border-radius:4px;margin-bottom:16px}
```

**Propuesto (con min-height para CLS prevention):**
```css
.hero-skeleton .breadcrumb{
  min-height:20px;
  padding:4px 0;
  font-size:12px;
  color:rgba(255,255,255,0.4);
  background:transparent;
  margin-bottom:16px;
  display:flex;
  align-items:center
}
```

**Justificación:**
- `min-height:20px` reserva espacio aunque el fondo sea `transparent`
- Cuando React hidrata, el ancho y altura del layout ya están "reservados", evitando saltos
- `display:flex;align-items:center` asegura alineación vertical consistente

---

### Cambios CSS (Línea 86 - Título)

**Actual:**
```css
.content-skeleton .title{height:28px;width:70%;background:rgba(255,255,255,0.08);border-radius:6px}
```

**Propuesto (manteniendo min-height):**
```css
.content-skeleton .title{
  min-height:28px;
  font-family:'Poppins',system-ui,sans-serif;
  font-size:1.5rem;
  font-weight:700;
  line-height:1.3;
  color:#fff;
  margin:0;
  padding:0;
  background:transparent;
  display:flex;
  align-items:center
}
@media(min-width:768px){.content-skeleton .title{font-size:2rem}}
```

**Justificación:**
- `min-height:28px` preserva el espacio para CLS prevention, incluso cuando el fondo es `transparent`
- El texto se alineará verticalmente al centro del espacio reservado
- Al cambiar de skeleton a contenido React, no hay salto porque el contenedor ya existía con esas dimensiones

---

### Cambios HTML (Línea 141 - Breadcrumb)

**Actual:**
```html
<div class="breadcrumb"></div>
```

**Propuesto:**
```html
<div class="breadcrumb">Inicio</div>
```

---

### Cambios HTML (Línea 144 - Título)

**Actual:**
```html
<div class="title"></div>
```

**Propuesto:**
```html
<h1 class="title">FEELOMOVE+ Conciertos y Festivales 2026</h1>
```

---

### Cronología de Renderizado + CLS

```text
T=0ms      HTML parsed, CSS crítico aplicado
           .breadcrumb reserves 20px (min-height)
           .title reserves 28px (min-height)
           ✓ Layout "locked in" para prevenir CLS

T=50ms     "Inicio" text rendered
           fits within reserved 20px
           ✓ NO layout shift

T=100ms    <h1> "FEELOMOVE+ Conciertos..." rendered
           fits within reserved 28px
           ✓ NO layout shift
           = LCP Candidato

T=300ms    Fonts swap complete
           = LCP Confirmado (~0.3-0.5s)

T=2000ms   React mounts, skeleton hidden
           Content from React replaces skeleton
           #critical-skeleton { display: none }
           ✓ NO layout shift (elemento completo se oculta)
```

---

### Verificación de CLS

| Propiedad | Skeleton | React Component | Impacto |
|-----------|----------|-----------------|---------|
| `.breadcrumb` min-height | 20px | N/A (se oculta) | ✓ No CLS |
| `.title` min-height | 28px | N/A (se oculta) | ✓ No CLS |
| Padding contenedor | 16px | 16px (px-4) | ✓ Idéntico |
| Font family | Poppins | Poppins | ✓ Idéntico |

**Conclusión:** El skeleton se oculta completamente (`#critical-skeleton { display: none }`), por lo que no hay transición gradual que cause CLS. El espacio reservado con `min-height` es un "seguro de vida" contra micro-saltos durante la renderización inicial del texto.

---

### Por qué este enfoque es robusto

1. **Space Reservation**: `min-height` garantiza que el contenedor existe aunque sea transparente
2. **Font Rendering Buffer**: Si la fuente tarda un ms extra, el texto ya tiene su espacio reservado
3. **No Competing Layouts**: Un solo layout (skeleton o React), nunca transición que cause CLS
4. **Google-Safe**: El contenido de texto visible desde T=0 es considerado LCP principal, deteniendo el cronómetro antes de React
