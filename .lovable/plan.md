

## Plan: Añadir "Hoteles por Ciudad" en el Footer

### Cambios en `src/components/Footer.tsx`

1. Añadir constante con las 5 ciudades y sus URLs de Nuitee (con placeId correctos).

2. Añadir quinta columna en la grid del directorio SEO: "Hoteles por Ciudad" / "Hotels by City" con enlaces externos a cada ciudad.

3. Cambiar grid de `md:grid-cols-4` a `md:grid-cols-5`.

4. Añadir "Hoteles" en la sección "Explorar" como enlace genérico a `https://feelomove.nuitee.link/`.

Todos los enlaces serán `<a>` con `target="_blank"`, `rel="noopener noreferrer"`, y anchor text tipo "Hoteles en Madrid" / "Hotels in Madrid".

