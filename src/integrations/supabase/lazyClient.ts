// Lazy-loaded Supabase client for deferred loading
// This reduces initial JS by ~38KB by only loading Supabase when needed

let supabaseClient: typeof import('./client').supabase | null = null;
let loadPromise: Promise<typeof import('./client').supabase> | null = null;

/**
 * Get the Supabase client, loading it lazily on first use.
 * This defers the ~38KB Supabase SDK until a query is actually made.
 */
export const getSupabase = async () => {
  if (supabaseClient) return supabaseClient;
  
  if (!loadPromise) {
    loadPromise = import('./client').then(mod => {
      supabaseClient = mod.supabase;
      return supabaseClient;
    });
  }
  
  return loadPromise;
};

/**
 * Synchronous access to Supabase client (returns null if not yet loaded).
 * Use getSupabase() for guaranteed access.
 */
export const getSupabaseSync = () => supabaseClient;
