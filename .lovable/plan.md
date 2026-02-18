
# Fase 0 + Preparacion: Redirects /es/* y traducciones faltantes

## Que se hace en esta iteracion

### 1. Redirects 301 de /es/* a /* en vercel.json

Agregar en la seccion "redirects" de `vercel.json` (antes de los redirects existentes):

```text
/es/conciertos/:path*  ->  301  ->  /conciertos/:path*
/es/festivales/:path*  ->  301  ->  /festivales/:path*
/es/destinos/:path*    ->  301  ->  /destinos/:path*
/es/artistas/:path*    ->  301  ->  /artistas/:path*
/es/favoritos/:path*   ->  301  ->  /favoritos/:path*
/es/inspiration/:path* ->  301  ->  /inspiration/:path*
/es/about/:path*       ->  301  ->  /about/:path*
/es/conciertos         ->  301  ->  /conciertos
/es/festivales         ->  301  ->  /festivales
/es/destinos           ->  301  ->  /destinos
/es/artistas           ->  301  ->  /artistas
/es/favoritos          ->  301  ->  /favoritos
/es/inspiration        ->  301  ->  /inspiration
/es/about              ->  301  ->  /about
/es/                   ->  301  ->  /
/es                    ->  301  ->  /
```

Agregar rewrite para /en/* (antes del catch-all):

```text
/en/(.*)  ->  rewrite  ->  /index.html
```

### 2. Insertar traducciones faltantes en tm_translations

Ejecutar SQL para insertar los textos identificados que faltan (estados de eventos, hero, secciones, CTAs, legal, etc.).

## Por que esto primero

- Los redirects /es/* protegen contra contenido duplicado desde el dia 1
- Las traducciones deben existir en BD antes de que el codigo las consuma (Fase 1)
- Son cambios de bajo riesgo que no afectan al sitio actual

## Siguiente paso

Una vez confirmado que los redirects funcionan y las traducciones estan en BD, pasamos a **Fase 1: Infraestructura i18n** (LanguageContext, useTranslation, i18nRoutes).
