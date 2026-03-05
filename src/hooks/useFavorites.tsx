import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface FavoriteEvent {
  event_id: string;
  event_name: string;
  event_slug: string;
  event_date: string;
  venue_city: string;
  image_url?: string;
  is_festival?: boolean | null;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [dbFavoriteIds, setDbFavoriteIds] = useState<string[]>([]);
  
  let user: ReturnType<typeof useAuth>['user'] = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    // AuthProvider not mounted yet — anon mode
  }

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("feelomove_favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  // Sync from DB when authenticated
  useEffect(() => {
    if (!user) return;
    supabase
      .from('subscribers')
      .select('favorite_event_ids')
      .eq('auth_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.favorite_event_ids) {
          setDbFavoriteIds(data.favorite_event_ids);
        }
      });
  }, [user]);

  const syncToDb = useCallback(async (newIds: string[]) => {
    if (!user) return;
    await supabase
      .from('subscribers')
      .update({ favorite_event_ids: newIds, updated_at: new Date().toISOString() })
      .eq('auth_user_id', user.id);
  }, [user]);

  const addFavorite = useCallback((event: FavoriteEvent) => {
    setFavorites(prev => {
      const newFavorites = [...prev, event];
      localStorage.setItem("feelomove_favorites", JSON.stringify(newFavorites));
      const newIds = newFavorites.map(f => f.event_id);
      setDbFavoriteIds(newIds);
      syncToDb(newIds);
      return newFavorites;
    });
  }, [syncToDb]);

  const removeFavorite = useCallback((eventId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(f => f.event_id !== eventId);
      localStorage.setItem("feelomove_favorites", JSON.stringify(newFavorites));
      const newIds = newFavorites.map(f => f.event_id);
      setDbFavoriteIds(newIds);
      syncToDb(newIds);
      return newFavorites;
    });
  }, [syncToDb]);

  const isFavorite = useCallback((eventId: string) => {
    return favorites.some(f => f.event_id === eventId) || dbFavoriteIds.includes(eventId);
  }, [favorites, dbFavoriteIds]);

  const toggleFavorite = useCallback((event: FavoriteEvent) => {
    if (isFavorite(event.event_id)) {
      removeFavorite(event.event_id);
    } else {
      addFavorite(event);
    }
  }, [isFavorite, removeFavorite, addFavorite]);

  const isAuthenticated = !!user;

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    isAuthenticated,
  };
};
