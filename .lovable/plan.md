

## Forzar redeploy en Vercel

### Objetivo
Hacer un cambio minimo en el codigo para que Lovable sincronice con GitHub y Vercel detecte el nuevo commit, forzando un redeploy que aplique el `vercel.json` actualizado con los rewrites de los sitemaps EN.

### Cambio propuesto
Anadir un comentario en `src/main.tsx` (por ejemplo: `// Force Vercel redeploy - sitemap EN rewrites`). Este cambio no afecta la funcionalidad de la aplicacion.

### Resultado esperado
1. Lovable pushea el cambio a GitHub
2. Vercel detecta el nuevo commit y lanza un deploy automatico
3. Los rewrites de `/sitemap-en.xml`, `/sitemap-en-pages.xml`, etc. se activan en produccion
4. `https://feelomove.com/sitemap-en.xml` devuelve el XML correcto en lugar del HTML de la SPA

