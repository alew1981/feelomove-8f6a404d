/**
 * Centralized Event Filtering Logic
 * 
 * Filters out "garbage" events that should not be displayed or indexed:
 * - Parking, Ticketless, Upgrade, Voucher, Hotel, Bus, Shuttle
 * - VIP Packages (should link to main event instead)
 * 
 * These events are marked as is_transport=true in the database
 * but this provides client-side fallback filtering.
 */

/**
 * Keywords that identify technical/service events that should be filtered out
 * These are NOT real concerts/festivals - they are add-on services
 */
export const EXCLUDED_EVENT_KEYWORDS = [
  'parking',
  'ticketless',
  'upgrade',
  'voucher',
  'shuttle',
  'transfer',
  'transporte',
  'servicio de autobus',
  'plaza de parking',
  'hotel package',
  'hotel +',
] as const;

/**
 * Keywords that identify VIP packages (should be grouped with main event)
 */
export const VIP_PACKAGE_KEYWORDS = [
  'paquetes vip',
  'vip packages',
  'vip package',
  'paquete vip',
] as const;

/**
 * Normalizes text for comparison (removes accents, lowercase)
 */
export const normalizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Checks if an event name contains any excluded keywords
 */
export const isExcludedEvent = (eventName: string | null | undefined): boolean => {
  const normalized = normalizeText(eventName);
  return EXCLUDED_EVENT_KEYWORDS.some(keyword => normalized.includes(keyword));
};

/**
 * Checks if an event is a VIP package
 */
export const isVipPackage = (eventName: string | null | undefined): boolean => {
  const normalized = normalizeText(eventName);
  return VIP_PACKAGE_KEYWORDS.some(keyword => normalized.includes(keyword));
};

/**
 * Checks if an event should be hidden from listings
 * This includes: excluded events, VIP packages, events without price, events with placeholder dates
 */
export const shouldHideEvent = (event: {
  name?: string | null;
  event_name?: string | null;
  is_transport?: boolean | null;
  is_package?: boolean | null;
  price_min_incl_fees?: number | null;
  event_date?: string | null;
}): boolean => {
  const eventName = event.name || event.event_name;
  
  // Filter 1: Already marked as transport in DB
  if (event.is_transport === true) {
    return true;
  }
  
  // Filter 2: Name contains excluded keywords
  if (isExcludedEvent(eventName)) {
    return true;
  }
  
  // Filter 3: VIP packages (optional - can be controlled separately)
  // Note: We show VIP packages but they should be grouped with main event
  // if (isVipPackage(eventName)) {
  //   return true;
  // }
  
  // Filter 4: Placeholder dates (9999)
  if (event.event_date?.startsWith('9999')) {
    return true;
  }
  
  return false;
};

/**
 * Filters an array of events, removing technical/service events
 */
export const filterVisibleEvents = <T extends {
  name?: string | null;
  event_name?: string | null;
  is_transport?: boolean | null;
  is_package?: boolean | null;
  price_min_incl_fees?: number | null;
  event_date?: string | null;
}>(events: T[]): T[] => {
  return events.filter(event => !shouldHideEvent(event));
};

/**
 * All keywords for SQL ILIKE filtering (used in database queries and migrations)
 */
export const ALL_FILTER_KEYWORDS = [
  ...EXCLUDED_EVENT_KEYWORDS,
  ...VIP_PACKAGE_KEYWORDS,
] as const;
