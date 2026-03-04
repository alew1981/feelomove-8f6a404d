import { useMemo, useEffect } from "react";
import { EventStatusType } from "./EventStatusBanner";

interface EventLocation {
  name: string;
  streetAddress?: string;
  city: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  url?: string;
}

interface EventOffer {
  lowPrice: number;
  highPrice?: number;
  currency?: string;
  url: string;
  availability: 'InStock' | 'SoldOut' | 'PreOrder' | 'LimitedAvailability';
  validFrom?: string;
}

interface EventPerformer {
  name: string;
  type?: 'Person' | 'MusicGroup' | 'PerformingGroup';
}

export interface EventSeoProps {
  /** Unique identifier for the event (used for script ID) */
  eventId: string;
  /** Event name/title */
  name: string;
  /** Event description */
  description: string;
  /** Primary image URL */
  image: string;
  /** Additional image URLs for different aspect ratios */
  images?: {
    square?: string;    // 1:1
    standard?: string;  // 4:3
    wide?: string;      // 16:9
  };
  /** ISO 8601 start date */
  startDate: string;
  /** Local event date string from Supabase (used for timezone-aware startDate) */
  localEventDate?: string;
  /** ISO 8601 end date (defaults to startDate if not provided) */
  endDate?: string;
  /** Door opening time (ISO 8601) */
  doorTime?: string;
  /** Event location details */
  location: EventLocation;
  /** Event performers/artists */
  performers?: EventPerformer[];
  /** Ticket offers */
  offers?: EventOffer;
  /** Event status */
  status?: EventStatusType;
  /** Whether this is a festival */
  isFestival?: boolean;
  /** Canonical URL of the event */
  url: string;
  /** Organizer name */
  organizerName?: string;
  /** Organizer URL */
  organizerUrl?: string;
  /** Ticketmaster event URL (used for seatmap) */
  ticketmasterUrl?: string;
}

/**
 * Safely escapes a string for use in JSON-LD to prevent XSS and syntax errors
 */
const escapeJsonLdString = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')      // Escape backslashes first
    .replace(/"/g, '\\"')         // Escape double quotes
    .replace(/\n/g, '\\n')        // Escape newlines
    .replace(/\r/g, '\\r')        // Escape carriage returns
    .replace(/\t/g, '\\t')        // Escape tabs
    .replace(/</g, '\\u003c')     // Escape < to prevent script injection
    .replace(/>/g, '\\u003e')     // Escape > to prevent script injection
    .replace(/&/g, '\\u0026');    // Escape & for safety
};

/**
 * Converts UTC event_date + local_event_date into a proper ISO 8601 string
 * with the correct timezone offset (CET +01:00 or CEST +02:00).
 */
function getStartDateForSchema(eventDate: string, localEventDate: string): string {
  const utcDate = new Date(eventDate);
  const localDate = new Date(localEventDate);
  const offsetHours = Math.round((localDate.getTime() - utcDate.getTime()) / 3600000);
  const offset = offsetHours >= 2 ? '+02:00' : '+01:00';
  
  // Eliminar cualquier offset existente con regex anclado al final
  const clean = localEventDate
    .replace(/[+-]\d{2}:\d{2}$/, '')
    .replace(/[+-]\d{2}$/, '')
    .trim()
    .replace(' ', 'T');
  
  return clean + offset;
}

/**
 * Maps internal event status to Schema.org eventStatus URL
 */
const getSchemaEventStatus = (
  status: EventStatusType | undefined,
  extra?: { cancelled?: boolean | null; sold_out?: boolean | null; seats_available?: boolean | null; schedule_status?: string | null }
): string => {
  if (extra?.cancelled) return 'https://schema.org/EventCancelled';
  if (extra?.sold_out || extra?.schedule_status === 'soldout') return 'https://schema.org/EventSoldOut';
  if (extra?.seats_available === false || extra?.schedule_status === 'offsale') return 'https://schema.org/EventSoldOut';
  switch (status) {
    case 'cancelled':
      return 'https://schema.org/EventCancelled';
    case 'rescheduled':
      return 'https://schema.org/EventRescheduled';
    case 'past':
    case 'scheduled':
    default:
      return 'https://schema.org/EventScheduled';
  }
};

/**
 * Maps offer availability to Schema.org availability URL
 */
const getSchemaAvailability = (availability: EventOffer['availability']): string => {
  const availabilityMap = {
    'InStock': 'https://schema.org/InStock',
    'SoldOut': 'https://schema.org/SoldOut',
    'PreOrder': 'https://schema.org/PreOrder',
    'LimitedAvailability': 'https://schema.org/LimitedAvailability',
  };
  return availabilityMap[availability] || 'https://schema.org/InStock';
};

/**
 * Builds the image array with multiple aspect ratios for Google Rich Results
 * Google recommends images in 1:1, 4:3, and 16:9 aspect ratios
 */
const buildImageArray = (
  primaryImage: string,
  images?: EventSeoProps['images']
): string[] => {
  const imageSet = new Set<string>();
  
  // Add primary image first
  if (primaryImage) {
    imageSet.add(primaryImage);
  }
  
  // Add aspect ratio variants if provided
  if (images) {
    if (images.wide) imageSet.add(images.wide);      // 16:9
    if (images.standard) imageSet.add(images.standard); // 4:3
    if (images.square) imageSet.add(images.square);   // 1:1
  }
  
  return Array.from(imageSet);
};

/**
 * EventSeo Component
 * 
 * Generates and injects Schema.org Event JSON-LD structured data into the document head.
 * Follows Google's guidelines for Event rich results.
 * 
 * REQUIRED FIELDS for Google:
 * - name: Event name
 * - startDate: ISO 8601 date format
 * - location: Place with address
 * 
 * RECOMMENDED FIELDS:
 * - image: At least one image URL
 * - description: Event description
 * - offers: Ticket pricing information
 * 
 * @see https://developers.google.com/search/docs/appearance/structured-data/event
 */
export const EventSeo = ({
  eventId,
  name,
  description,
  image,
  images,
  startDate,
  localEventDate,
  endDate,
  doorTime,
  location,
  performers = [],
  offers,
  status = 'scheduled',
  isFestival = false,
  url,
  organizerName = 'FEELOMOVE+',
  organizerUrl = 'https://feelomove.com',
  ticketmasterUrl,
  locale = 'es',
}: EventSeoProps & { locale?: 'es' | 'en' }) => {
  
  // Build the JSON-LD object with proper escaping
  const jsonLd = useMemo(() => {
    // CRITICAL: Validate required fields for Google Rich Results
    if (!startDate) {
      console.error('[EventSeo] CRITICAL: Missing startDate for event:', name);
    }
    if (!image && !images?.wide && !images?.standard) {
      console.warn('[EventSeo] WARNING: Missing image for event:', name);
    }
    if (!location?.name || !location?.city) {
      console.warn('[EventSeo] WARNING: Incomplete location for event:', name);
    }
    
    // Ensure startDate is in proper ISO 8601 format
    const formatDateToISO = (dateStr: string | undefined | null): string => {
      if (!dateStr) return new Date().toISOString();
      
      try {
        // If already ISO format, return as-is
        if (dateStr.includes('T')) {
          return dateStr;
        }
        // Convert date string to ISO format
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.error('[EventSeo] Invalid date format:', dateStr);
          return new Date().toISOString();
        }
        return date.toISOString();
      } catch (e) {
        console.error('[EventSeo] Error parsing date:', dateStr, e);
        return new Date().toISOString();
      }
    };
    
    // Use timezone-aware date when local_event_date is available
    const formattedStartDate = (localEventDate && startDate)
      ? getStartDateForSchema(startDate, localEventDate)
      : formatDateToISO(startDate);
    const formattedEndDate = formatDateToISO(endDate || startDate);
    
    // ROBUST FALLBACK: Ensure we always have a valid image
    const primaryImage = image || images?.wide || images?.standard || 'https://feelomove.com/og-image.jpg';
    const absoluteUrl = url.startsWith('http') ? url : `https://feelomove.com${url}`;
    
    // ROBUST FALLBACK: Build location object with defaults for missing data
    // Google requires valid location - use sensible fallbacks
    const locationName = escapeJsonLdString(location.name) || 'Recinto por confirmar';
    const locationCity = escapeJsonLdString(location.city) || 'España';
    
    const locationSchema: Record<string, unknown> = {
      '@type': 'Place',
      name: locationName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: escapeJsonLdString(location.streetAddress) || locationName,
        addressLocality: locationCity,
        addressRegion: locationCity, // Use city as region for Spain
        postalCode: location.postalCode || undefined,
        addressCountry: location.country || 'ES',
      },
    };
    
    // Add geo coordinates if available
    if (location.latitude && location.longitude) {
      locationSchema.geo = {
        '@type': 'GeoCoordinates',
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }
    
    // Add venue URL if available
    if (location.url) {
      locationSchema.url = location.url;
    }
    
    // Build performers array
    const performerSchema = performers.length > 0
      ? performers.map(p => ({
          '@type': p.type || 'MusicGroup',
          name: escapeJsonLdString(p.name),
        }))
      : undefined;
    
    // ROBUST FALLBACK: Always build offers object with sensible defaults
    // Google Rich Results requires valid offers - never leave empty
    const buildOffersSchema = (): Record<string, unknown> => {
      const hasValidPrice = offers && offers.lowPrice > 0;
      const lowPrice = hasValidPrice ? offers.lowPrice : undefined;
      const highPrice = hasValidPrice && offers.highPrice ? offers.highPrice : undefined;
      
      // SoldOut MUST take priority over everything else
      const isSoldOut = offers?.availability === 'SoldOut' || status === 'cancelled';
      const isPastEvent = status === 'past';
      
      const availability = isSoldOut
        ? 'https://schema.org/SoldOut'
        : isPastEvent
          ? 'https://schema.org/SoldOut'
          : offers?.availability
            ? getSchemaAvailability(offers.availability)
            : 'https://schema.org/InStock';
      
      const offersObj: Record<string, unknown> = {
        '@type': (lowPrice && highPrice && highPrice > lowPrice) ? 'AggregateOffer' : 'Offer',
        url: absoluteUrl,
        priceCurrency: offers?.currency || 'EUR',
        availability,
      };
      
      // Only include price fields when we have valid prices
      // Omitting price is valid per schema.org and avoids Google warnings
      if (lowPrice && highPrice && highPrice > lowPrice) {
        offersObj.lowPrice = lowPrice;
        offersObj.highPrice = highPrice;
      } else if (lowPrice) {
        offersObj.price = lowPrice;
      }
      // When no valid price exists, price is intentionally omitted
      
      if (offers?.validFrom) {
        offersObj.validFrom = offers.validFrom;
      }
      
      // Add seller information
      offersObj.seller = {
        '@type': 'Organization',
        name: organizerName,
        url: organizerUrl,
      };
      
      return offersObj;
    };
    
    const offersSchema = buildOffersSchema();
    
    // Build the complete JSON-LD object with REQUIRED fields first
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': isFestival ? 'Festival' : 'MusicEvent',
      '@id': absoluteUrl,
      // REQUIRED: name
      name: escapeJsonLdString(name) || 'Evento',
      // REQUIRED: startDate (in ISO 8601 format)
      startDate: formattedStartDate,
      // REQUIRED: location
      location: locationSchema,
      // RECOMMENDED: description
      description: escapeJsonLdString(description) || '',
      // RECOMMENDED: image (always include at least one)
      image: buildImageArray(primaryImage, images),
      // End date (defaults to startDate if not provided)
      endDate: formattedEndDate,
      eventStatus: getSchemaEventStatus(status),
      // Festival-specific: OfflineEventAttendanceMode indicates in-person attendance
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      url: absoluteUrl,
      inLanguage: locale === 'en' ? 'en-US' : 'es-ES',
      // For festivals, use a more descriptive organizer structure
      organizer: {
        '@type': 'Organization',
        name: organizerName,
        url: organizerUrl,
      },
      // Festival-specific: add typicalAgeRange for festivals
      ...(isFestival && {
        typicalAgeRange: '16+',
        isAccessibleForFree: false,
      }),
    };
    
    // Add optional fields
    if (doorTime) {
      schema.doorTime = doorTime;
    }
    
    if (performerSchema) {
      schema.performer = performerSchema;
    }
    
    // ALWAYS include offers (with fallbacks) - Google Rich Results requirement
    schema.offers = offersSchema;
    
    // Add seatmap if Ticketmaster URL is available
    if (ticketmasterUrl) {
      schema.seatmap = {
        '@type': 'Map',
        mapType: 'https://schema.org/SeatingMap',
        url: ticketmasterUrl,
      };
    }
    
    return schema;
  }, [
    eventId, name, description, image, images, startDate, localEventDate, endDate, doorTime,
    location, performers, offers, status, isFestival, url, organizerName, organizerUrl, ticketmasterUrl
  ]);
  
  // Inject JSON-LD into document head
  useEffect(() => {
    const scriptId = `event-seo-${eventId}`;
    
    // Remove existing script if present
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }
    
    // Create and inject new script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    
    // Use JSON.stringify for proper escaping of the entire object
    script.textContent = JSON.stringify(jsonLd, null, 0);
    
    document.head.appendChild(script);
    
    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [eventId, jsonLd]);
  
  // This component doesn't render anything visible
  return null;
};

/**
 * Helper function to create EventSeo props from event data
 * Use this to transform your event data into the required format
 * 
 * IMPORTANT: This function ensures all required fields have valid values
 */
export const createEventSeoProps = (eventData: {
  event_id: string;
  event_name: string;
  event_slug?: string;
  event_date: string | null | undefined;
  festival_end_date?: string | null;
  door_opening_date?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  venue_city: string | null | undefined;
  venue_postal_code?: string | null;
  venue_latitude?: number | null;
  venue_longitude?: number | null;
  venue_url?: string | null;
  image_large_url?: string | null;
  image_standard_url?: string | null;
  attraction_names?: string[] | null;
  price_min_incl_fees?: number | null;
  price_max_incl_fees?: number | null;
  on_sale_date?: string | null;
  sold_out?: boolean | null;
  cancelled?: boolean | null;
  rescheduled?: boolean | null;
  is_festival?: boolean | null;
  url?: string | null;
  local_event_date?: string | null;
  tickets_status?: string | null;
  seats_available?: boolean | null;
  schedule_status?: string | null;
}, options: {
  description: string;
  url: string;
  status: EventStatusType;
  isEventAvailable: boolean;
}): EventSeoProps => {
  const performers: EventPerformer[] = (eventData.attraction_names || []).map(name => ({
    name,
    type: 'MusicGroup' as const,
  }));
  
  // tickets_status de DB tiene prioridad sobre flags legacy
  let availability: EventOffer['availability'] = 'InStock';

  if (eventData.cancelled || options.status === 'cancelled') {
    availability = 'SoldOut';
  } else if (eventData.tickets_status === 'sold_out' || eventData.sold_out) {
    availability = 'SoldOut';
  } else if (eventData.tickets_status === 'off_sale') {
    availability = 'PreOrder';
  } else if (!options.isEventAvailable) {
    availability = 'SoldOut'; // fallback legacy
  } else if (eventData.tickets_status === 'available') {
    availability = 'InStock';
  }
  
  // CRITICAL: Ensure event_date is always present
  // If missing, log error and use a far-future date as fallback
  let validEventDate = eventData.event_date;
  if (!validEventDate) {
    console.error('[createEventSeoProps] CRITICAL: Missing event_date for event:', eventData.event_name);
    validEventDate = new Date().toISOString();
  }
  
  // CRITICAL: Ensure image is always present
  const primaryImage = eventData.image_large_url || eventData.image_standard_url || 'https://feelomove.com/og-image.jpg';
  if (!eventData.image_large_url && !eventData.image_standard_url) {
    console.warn('[createEventSeoProps] WARNING: Missing image for event:', eventData.event_name);
  }
  
  // Ensure venue_city has a value
  const venueCity = eventData.venue_city || 'España';
  if (!eventData.venue_city) {
    console.warn('[createEventSeoProps] WARNING: Missing venue_city for event:', eventData.event_name);
  }
  
  return {
    eventId: eventData.event_id || 'unknown',
    name: eventData.event_name || 'Evento',
    description: options.description || '',
    image: primaryImage,
    images: {
      wide: eventData.image_large_url || undefined,    // Typically 16:9
      standard: eventData.image_standard_url || undefined, // Typically 4:3
    },
    startDate: validEventDate,
    localEventDate: eventData.local_event_date || undefined,
    endDate: eventData.festival_end_date || validEventDate,
    doorTime: eventData.door_opening_date || undefined,
    location: {
      name: eventData.venue_name || 'Venue',
      streetAddress: eventData.venue_address || undefined,
      city: venueCity,
      postalCode: eventData.venue_postal_code || undefined,
      country: 'ES',
      latitude: eventData.venue_latitude || undefined,
      longitude: eventData.venue_longitude || undefined,
      url: eventData.venue_url || undefined,
    },
    performers,
    offers: {
      lowPrice: eventData.price_min_incl_fees || 0,
      highPrice: eventData.price_max_incl_fees || undefined,
      currency: 'EUR',
      url: options.url,
      availability,
      validFrom: eventData.on_sale_date || undefined,
    },
    status: options.status,
    _eventStatusExtra: {
      cancelled: eventData.cancelled,
      sold_out: eventData.sold_out,
      seats_available: eventData.seats_available,
      schedule_status: eventData.schedule_status,
    },
    isFestival: eventData.is_festival || false,
    url: options.url,
    ticketmasterUrl: eventData.url || undefined,
  };
};

export default EventSeo;
