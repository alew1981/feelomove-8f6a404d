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
 * Maps internal event status to Schema.org eventStatus URL
 */
const getSchemaEventStatus = (status: EventStatusType | undefined): string => {
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
 * @see https://developers.google.com/search/docs/appearance/structured-data/event
 */
export const EventSeo = ({
  eventId,
  name,
  description,
  image,
  images,
  startDate,
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
}: EventSeoProps) => {
  
  // Build the JSON-LD object with proper escaping
  const jsonLd = useMemo(() => {
    const absoluteUrl = url.startsWith('http') ? url : `https://feelomove.com${url}`;
    
    // Build location object
    const locationSchema: Record<string, unknown> = {
      '@type': 'Place',
      name: escapeJsonLdString(location.name),
      address: {
        '@type': 'PostalAddress',
        streetAddress: escapeJsonLdString(location.streetAddress || location.name),
        addressLocality: escapeJsonLdString(location.city),
        addressRegion: escapeJsonLdString(location.city), // Use city as region for Spain
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
    
    // Build offers object
    let offersSchema: Record<string, unknown> | undefined;
    if (offers) {
      offersSchema = {
        '@type': offers.highPrice && offers.highPrice !== offers.lowPrice 
          ? 'AggregateOffer' 
          : 'Offer',
        url: absoluteUrl,
        priceCurrency: offers.currency || 'EUR',
        availability: getSchemaAvailability(
          status === 'past' || status === 'cancelled' ? 'SoldOut' : offers.availability
        ),
      };
      
      // Use lowPrice/highPrice for AggregateOffer, price for Offer
      if (offers.highPrice && offers.highPrice !== offers.lowPrice) {
        offersSchema.lowPrice = offers.lowPrice;
        offersSchema.highPrice = offers.highPrice;
      } else {
        offersSchema.price = offers.lowPrice;
      }
      
      if (offers.validFrom) {
        offersSchema.validFrom = offers.validFrom;
      }
      
      // Add seller information
      offersSchema.seller = {
        '@type': 'Organization',
        name: organizerName,
        url: organizerUrl,
      };
    }
    
    // Build the complete JSON-LD object
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': isFestival ? 'Festival' : 'MusicEvent',
      '@id': absoluteUrl,
      name: escapeJsonLdString(name),
      description: escapeJsonLdString(description),
      image: buildImageArray(image, images),
      startDate: startDate,
      endDate: endDate || startDate,
      eventStatus: getSchemaEventStatus(status),
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: locationSchema,
      url: absoluteUrl,
      inLanguage: 'es',
      organizer: {
        '@type': 'Organization',
        name: organizerName,
        url: organizerUrl,
      },
    };
    
    // Add optional fields
    if (doorTime) {
      schema.doorTime = doorTime;
    }
    
    if (performerSchema) {
      schema.performer = performerSchema;
    }
    
    if (offersSchema) {
      schema.offers = offersSchema;
    }
    
    return schema;
  }, [
    eventId, name, description, image, images, startDate, endDate, doorTime,
    location, performers, offers, status, isFestival, url, organizerName, organizerUrl
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
 */
export const createEventSeoProps = (eventData: {
  event_id: string;
  event_name: string;
  event_slug?: string;
  event_date: string;
  festival_end_date?: string;
  door_opening_date?: string;
  venue_name?: string;
  venue_address?: string;
  venue_city: string;
  venue_postal_code?: string;
  venue_latitude?: number;
  venue_longitude?: number;
  venue_url?: string;
  image_large_url?: string;
  image_standard_url?: string;
  attraction_names?: string[];
  price_min_incl_fees?: number;
  price_max_incl_fees?: number;
  on_sale_date?: string;
  sold_out?: boolean;
  cancelled?: boolean;
  rescheduled?: boolean;
  is_festival?: boolean;
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
  
  // Determine offer availability
  let availability: EventOffer['availability'] = 'InStock';
  if (options.status === 'past' || options.status === 'cancelled') {
    availability = 'SoldOut';
  } else if (eventData.sold_out) {
    availability = 'SoldOut';
  } else if (!options.isEventAvailable) {
    availability = 'PreOrder';
  }
  
  return {
    eventId: eventData.event_id,
    name: eventData.event_name,
    description: options.description,
    image: eventData.image_large_url || eventData.image_standard_url || '',
    images: {
      wide: eventData.image_large_url,    // Typically 16:9
      standard: eventData.image_standard_url, // Typically 4:3
    },
    startDate: eventData.event_date,
    endDate: eventData.festival_end_date || eventData.event_date,
    doorTime: eventData.door_opening_date,
    location: {
      name: eventData.venue_name || 'Venue',
      streetAddress: eventData.venue_address,
      city: eventData.venue_city,
      postalCode: eventData.venue_postal_code,
      country: 'ES',
      latitude: eventData.venue_latitude,
      longitude: eventData.venue_longitude,
      url: eventData.venue_url,
    },
    performers,
    offers: {
      lowPrice: eventData.price_min_incl_fees || 0,
      highPrice: eventData.price_max_incl_fees,
      currency: 'EUR',
      url: options.url,
      availability,
      validFrom: eventData.on_sale_date,
    },
    status: options.status,
    isFestival: eventData.is_festival || false,
    url: options.url,
  };
};

export default EventSeo;
