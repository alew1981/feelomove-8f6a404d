// Utilidad para generar meta-descriptions “Súper SEO” consistentes en destinos.

interface BuildDestinationSeoDescriptionParams {
  cityName: string;
  totalEvents: number;
  concertsCount?: number;
  festivalsCount?: number;
  topArtists?: string[];
  minPriceEur?: number | null;
}

export function buildDestinationSeoDescription({
  cityName,
  totalEvents,
  concertsCount,
  festivalsCount,
  topArtists,
  minPriceEur,
}: BuildDestinationSeoDescriptionParams): string {
  const parts: string[] = [];

  // Apertura
  parts.push(`Descubre conciertos y festivales en ${cityName}.`);

  // Conteos
  if (Number.isFinite(concertsCount) || Number.isFinite(festivalsCount)) {
    const c = concertsCount ?? 0;
    const f = festivalsCount ?? 0;
    parts.push(`Hay ${totalEvents} eventos: ${c} conciertos y ${f} festivales.`);
  } else {
    parts.push(`Hay ${totalEvents} eventos disponibles.`);
  }

  // Artistas
  const artistsText = topArtists?.filter(Boolean).slice(0, 6).join(", ");
  if (artistsText) {
    parts.push(`Artistas y headliners: ${artistsText}.`);
  }

  // Precio
  if (minPriceEur && minPriceEur > 0) {
    parts.push(`Precios desde ${Math.round(minPriceEur)}€.`);
  }

  // CTA
  parts.push("Compra entradas y reserva hotel cerca del evento.");

  return parts.join(" ");
}
