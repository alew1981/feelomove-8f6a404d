import { useState, useEffect, useCallback } from "react";

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

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("feelomove_favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  const addFavorite = useCallback((event: FavoriteEvent) => {
    setFavorites(prev => {
      const newFavorites = [...prev, event];
      localStorage.setItem("feelomove_favorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const removeFavorite = useCallback((eventId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(f => f.event_id !== eventId);
      localStorage.setItem("feelomove_favorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((eventId: string) => {
    return favorites.some(f => f.event_id === eventId);
  }, [favorites]);

  const toggleFavorite = useCallback((event: FavoriteEvent) => {
    if (isFavorite(event.event_id)) {
      removeFavorite(event.event_id);
    } else {
      addFavorite(event);
    }
  }, [isFavorite, removeFavorite, addFavorite]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
};
