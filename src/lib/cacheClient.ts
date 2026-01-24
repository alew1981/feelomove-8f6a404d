import { supabase } from "@/integrations/supabase/client";

/**
 * Cache TTL configuration with differentiated lifetimes
 * 
 * SERVER-SIDE CACHE STRATEGY:
 * - Long TTL (12h) for events, artists, destinations - data that rarely changes
 * - Short TTL (30min) for hotel prices, availability - dynamic data
 * 
 * Client-side (react-query staleTime) uses shorter values for fresher UX
 */

// Server-side TTL values (used for localStorage persistence)
export const SERVER_CACHE_TTL = {
  // Long-lived data (12 hours) - events, artists rarely change mid-day
  events: 12 * 60 * 60 * 1000,      // 12 hours
  artists: 12 * 60 * 60 * 1000,     // 12 hours
  destinations: 12 * 60 * 60 * 1000, // 12 hours
  genres: 24 * 60 * 60 * 1000,       // 24 hours
  festivals: 12 * 60 * 60 * 1000,    // 12 hours
  
  // Short-lived data (30 minutes) - prices/availability change frequently
  hotels: 30 * 60 * 1000,           // 30 minutes
  availability: 15 * 60 * 1000,     // 15 minutes
  prices: 30 * 60 * 1000,           // 30 minutes
} as const;

// Client-side TTL (react-query staleTime) - shorter for responsive UX
export const CACHE_TTL = {
  // Long TTL data - still cache but allow background refresh
  events: 10 * 60 * 1000,       // 10 minutes client-side
  artists: 10 * 60 * 1000,      // 10 minutes
  destinations: 10 * 60 * 1000, // 10 minutes
  genres: 20 * 60 * 1000,       // 20 minutes
  festivals: 10 * 60 * 1000,    // 10 minutes
  
  // Short TTL data - more aggressive refresh
  hotels: 3 * 60 * 1000,        // 3 minutes
  availability: 1 * 60 * 1000,  // 1 minute
  prices: 3 * 60 * 1000,        // 3 minutes
} as const;

export type CacheType = keyof typeof CACHE_TTL;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // in seconds
  serverTtl: number; // server-side TTL in seconds for fallback
}

// Browser-level cache using localStorage with fallback
const LOCAL_CACHE_PREFIX = "feelomove_cache_v2_";
const MAX_CACHE_SIZE = 100; // Increased for better coverage

function getCacheKey(type: string, params: Record<string, unknown>): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join("&");
  return `${LOCAL_CACHE_PREFIX}${type}:${sortedParams}`;
}

function getFromLocalCache<T>(key: string): CacheEntry<T> | null {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function setLocalCache<T>(key: string, data: T, clientTtl: number, serverTtl: number): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: clientTtl / 1000,
      serverTtl: serverTtl / 1000,
    };
    localStorage.setItem(key, JSON.stringify(entry));
    cleanupLocalCache();
  } catch (e) {
    console.warn("Cache storage failed:", e);
  }
}

function cleanupLocalCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    
    if (keys.length > MAX_CACHE_SIZE) {
      const entries = keys.map(key => {
        try {
          const item = localStorage.getItem(key);
          const parsed = item ? JSON.parse(item) : null;
          return { key, timestamp: parsed?.timestamp || 0 };
        } catch {
          return { key, timestamp: 0 };
        }
      });
      
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
      toRemove.forEach(e => localStorage.removeItem(e.key));
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Check if cached entry is fresh (within client TTL)
 */
function isCacheFresh(entry: CacheEntry<unknown>): boolean {
  const age = (Date.now() - entry.timestamp) / 1000;
  return age < entry.ttl;
}

/**
 * Check if cached entry is usable for fallback (within server TTL)
 * This allows serving stale data when API fails
 */
function isCacheUsableForFallback(entry: CacheEntry<unknown>): boolean {
  const age = (Date.now() - entry.timestamp) / 1000;
  return age < entry.serverTtl;
}

/**
 * Enhanced cached query with:
 * - Differentiated TTL (client vs server)
 * - Stale-while-revalidate pattern
 * - Fallback to stale cache on errors (never show empty page)
 */
export async function cachedQuery<T>(
  type: CacheType,
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  cacheParams: Record<string, unknown> = {}
): Promise<T | null> {
  const cacheKey = getCacheKey(type, cacheParams);
  const clientTtl = CACHE_TTL[type];
  const serverTtl = SERVER_CACHE_TTL[type];
  
  // Check local cache first
  const cached = getFromLocalCache<T>(cacheKey);
  
  if (cached) {
    if (isCacheFresh(cached)) {
      // Fresh cache - return immediately, no network
      return cached.data;
    }
    
    // Stale but within server TTL - return stale, refresh in background
    if (isCacheUsableForFallback(cached)) {
      // Background refresh (fire and forget)
      (async () => {
        try {
          const { data, error } = await queryFn();
          if (!error && data) {
            setLocalCache(cacheKey, data, clientTtl, serverTtl);
          }
        } catch {
          // Ignore background refresh errors
        }
      })();
      
      return cached.data;
    }
  }
  
  // No cache or expired - fetch fresh data
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      // API failed - try to use any cached data as fallback
      if (cached && isCacheUsableForFallback(cached)) {
        console.warn(`Query failed, serving stale cache for ${type}:`, error.message);
        return cached.data;
      }
      
      // No fallback available
      console.error(`Query failed for ${type}:`, error);
      throw error;
    }
    
    if (data) {
      setLocalCache(cacheKey, data, clientTtl, serverTtl);
    }
    
    return data;
  } catch (error) {
    // Network error - try fallback
    if (cached && isCacheUsableForFallback(cached)) {
      console.warn(`Network error, serving stale cache for ${type}:`, error);
      return cached.data;
    }
    
    // Final fallback: even old cache is better than nothing
    if (cached) {
      console.warn(`Emergency fallback to old cache for ${type}`);
      return cached.data;
    }
    
    throw error;
  }
}

/**
 * Cached query specifically for hotel prices with short TTL
 */
export async function cachedHotelQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  cacheParams: Record<string, unknown> = {}
): Promise<T | null> {
  return cachedQuery<T>('hotels', queryFn, cacheParams);
}

/**
 * Cached query for event data with long TTL
 */
export async function cachedEventQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  cacheParams: Record<string, unknown> = {}
): Promise<T | null> {
  return cachedQuery<T>('events', queryFn, cacheParams);
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}

/**
 * Clear cache for a specific type
 */
export function clearCacheByType(type: CacheType): void {
  try {
    const prefix = `${LOCAL_CACHE_PREFIX}${type}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { count: number; types: Record<string, number> } {
  const types: Record<string, number> = {};
  let count = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LOCAL_CACHE_PREFIX)) {
        count++;
        const typeMatch = key.match(new RegExp(`${LOCAL_CACHE_PREFIX}(\\w+):`));
        if (typeMatch) {
          const type = typeMatch[1];
          types[type] = (types[type] || 0) + 1;
        }
      }
    }
  } catch {
    // Ignore errors
  }
  
  return { count, types };
}