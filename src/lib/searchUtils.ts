/**
 * Normalize text for search - removes accents, converts to lowercase
 * and handles special characters for accent-insensitive matching
 */
export const normalizeSearch = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .trim();
};

/**
 * Check if a search term matches a text (accent-insensitive)
 */
export const matchesSearch = (text: string, searchTerm: string): boolean => {
  if (!searchTerm) return true;
  if (!text) return false;
  
  const normalizedText = normalizeSearch(text);
  const normalizedSearch = normalizeSearch(searchTerm);
  
  return normalizedText.includes(normalizedSearch);
};

/**
 * Generate search variants for a term to improve database matching
 * This helps when the database doesn't have unaccent support
 */
export const getSearchVariants = (term: string): string[] => {
  const normalized = normalizeSearch(term);
  const variants = new Set<string>();
  
  variants.add(term);
  variants.add(normalized);
  
  // Common accent variations
  const accentMap: Record<string, string[]> = {
    'a': ['á', 'à', 'ä', 'â'],
    'e': ['é', 'è', 'ë', 'ê'],
    'i': ['í', 'ì', 'ï', 'î'],
    'o': ['ó', 'ò', 'ö', 'ô'],
    'u': ['ú', 'ù', 'ü', 'û'],
    'n': ['ñ'],
  };
  
  // Generate variant with accents added back
  let accentedVariant = normalized;
  for (const [base, accents] of Object.entries(accentMap)) {
    for (const accent of accents) {
      if (term.toLowerCase().includes(accent)) {
        accentedVariant = accentedVariant.replace(new RegExp(base, 'g'), accent);
      }
    }
  }
  variants.add(accentedVariant);
  
  return Array.from(variants).filter(v => v.length > 0);
};
