/**
 * Spanish month names for URL slugs
 */
const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Normalizes text to create URL-friendly slugs
 */
const normalizeToSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generates a festival slug with the format: [festival-name]-[city]-[day]-[month]-[year]
 * Falls back to [festival-name]-[city]-[year] if no exact date is available
 */
export const generateFestivalSlug = (
  festivalName: string,
  city: string,
  eventDate?: string | Date | null
): string => {
  const normalizedName = normalizeToSlug(festivalName);
  const normalizedCity = normalizeToSlug(city);
  
  if (!eventDate) {
    // No date provided - use current year as fallback
    const currentYear = new Date().getFullYear();
    return `${normalizedName}-${normalizedCity}-${currentYear}`;
  }
  
  const date = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;
  
  // Check for placeholder date (9999-12-31)
  if (date.getFullYear() === 9999) {
    // Use next year as fallback for TBA dates
    const nextYear = new Date().getFullYear() + 1;
    return `${normalizedName}-${normalizedCity}-${nextYear}`;
  }
  
  const day = date.getDate();
  const month = SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  
  return `${normalizedName}-${normalizedCity}-${day}-${month}-${year}`;
};

/**
 * Genera la URL correcta para un evento según su tipo
 * Para festivales usa /festival/, para conciertos usa /concierto/
 */
export const getEventUrl = (slug: string, isFestival?: boolean | null): string => {
  return `/${isFestival ? 'festival' : 'concierto'}/${slug}`;
};

/**
 * Generates the full festival URL with proper slug format
 */
export const getFestivalUrl = (
  festivalName: string,
  city: string,
  eventDate?: string | Date | null,
  existingSlug?: string
): string => {
  // If an existing slug is provided and it's valid, use it
  if (existingSlug && existingSlug.length > 0) {
    return `/festival/${existingSlug}`;
  }
  
  // Generate new slug based on festival data
  const slug = generateFestivalSlug(festivalName, city, eventDate);
  return `/festival/${slug}`;
};

/**
 * Detecta si un evento es concierto o festival basado en badges
 */
export const getEventCategory = (badges?: string[]): 'concert' | 'festival' | null => {
  if (!badges || !Array.isArray(badges)) return null;
  
  const isConcert = badges.some(b => b.toLowerCase().includes('concert'));
  const isFestival = badges.some(b => b.toLowerCase().includes('festival'));
  
  if (isFestival) return 'festival';
  if (isConcert) return 'concert';
  
  return null;
};

/**
 * Obtiene el nombre legible de la categoría
 */
export const getCategoryLabel = (badges?: string[]): string => {
  const category = getEventCategory(badges);
  
  if (category === 'concert') return 'Concierto';
  if (category === 'festival') return 'Festival';
  
  return 'Evento';
};

/**
 * Formatea fecha de evento
 */
export const formatEventDate = (date: string | Date): string => {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  
  return eventDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Formatea precio
 */
export const formatPrice = (price: number): string => {
  return `€${price.toFixed(2)}`;
};
