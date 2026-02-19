
## Tooltip en el selector de idioma (mobile)

### Que se hara

Envolver el boton `LanguageSwitcher` con un componente `Tooltip` de Radix UI (ya disponible en el proyecto como `src/components/ui/tooltip.tsx`). El tooltip mostrara:

- **ES**: "Selecciona tu idioma"  
- **EN**: "Select your language"

### Detalles tecnicos

**Archivo a modificar:** `src/components/LanguageSwitcher.tsx`

1. Importar `Tooltip`, `TooltipTrigger`, `TooltipContent` y `TooltipProvider` desde `@/components/ui/tooltip`.
2. Envolver el `<button>` existente con `<TooltipProvider>` > `<Tooltip>` > `<TooltipTrigger asChild>`.
3. Anadir `<TooltipContent>` con el texto localizado.
4. Se usara `delayDuration={300}` para que no aparezca accidentalmente al hacer scroll.
5. En mobile, el tooltip se activara con el long-press nativo de Radix (touch devices). En desktop funciona con hover como es habitual.

**Cambio unico** -- no se modifican otros archivos ni estilos.

### Nota sobre los textos

Los textos propuestos son correctos:
- "Selecciona tu idioma" (ES) -- claro y natural
- "Select your language" (EN) -- estandar internacional

Una alternativa seria usar textos que indiquen la accion directa ("Cambiar a English" / "Switch to Espanol"), pero los textos genericos que propones funcionan mejor como descubrimiento inicial del feature.
