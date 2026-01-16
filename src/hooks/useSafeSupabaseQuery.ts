import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SafeQueryOptions {
  table: string;
  select: string;
  filter?: Record<string, unknown>;
  enabled?: boolean;
  single?: boolean;
}

/**
 * Safe query hook that gracefully handles errors from materialized views
 * and other potentially unavailable database resources.
 * Returns null instead of throwing on errors.
 */
export function useSafeSupabaseQuery<T>(
  queryKey: string[],
  options: SafeQueryOptions
) {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<T | null> => {
      try {
        let query = supabase
          .from(options.table as any)
          .select(options.select);

        if (options.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        if (options.single) {
          const { data, error } = await query.single();
          if (error) {
            console.warn(`Safe query to ${options.table} failed:`, error.message);
            return null;
          }
          return data as T;
        }

        const { data, error } = await query;

        if (error) {
          console.warn(`Safe query to ${options.table} failed:`, error.message);
          return null;
        }

        return data as T;
      } catch (error) {
        console.error(`Safe query error for ${options.table}:`, error);
        return null;
      }
    },
    enabled: options.enabled ?? true,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Batch multiple Supabase queries in parallel with error handling.
 * Returns null for any failed queries instead of throwing.
 */
export async function batchSupabaseQueries<T extends Record<string, unknown>>(
  queries: Record<keyof T, () => Promise<unknown>>
): Promise<T> {
  try {
    const entries = Object.entries(queries);
    const promises = entries.map(([key, queryFn]) => 
      (queryFn as () => Promise<unknown>)().catch(error => {
        console.warn(`Batch query failed for ${key}:`, error);
        return null;
      })
    );

    const results = await Promise.all(promises);
    
    return entries.reduce((acc, [key], index) => {
      acc[key as keyof T] = results[index] as T[keyof T];
      return acc;
    }, {} as T);
  } catch (error) {
    console.error('Batch queries failed:', error);
    throw error;
  }
}
