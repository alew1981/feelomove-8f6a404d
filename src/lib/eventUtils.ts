/**
 * Genera la URL correcta para un evento según su tipo
 */
export const getEventUrl = (slug: string, isFestival?: boolean | null): string => {
  return `/${isFestival ? 'festival' : 'concierto'}/${slug}`;
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
