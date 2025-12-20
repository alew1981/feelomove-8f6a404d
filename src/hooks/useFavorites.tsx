import { useState, useEffect } from "react";

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

  useEffect(() => {
    const stored = localStorage.getItem("feelomove_favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  const addFavorite = (event: FavoriteEvent) => {
    const newFavorites = [...favorites, event];
    setFavorites(newFavorites);
    localStorage.setItem("feelomove_favorites", JSON.stringify(newFavorites));
  };

  const removeFavorite = (eventId: string) => {
    const newFavorites = favorites.filter(f => f.event_id !== eventId);
    setFavorites(newFavorites);
    localStorage.setItem("feelomove_favorites", JSON.stringify(newFavorites));
  };

  const isFavorite = (eventId: string) => {
    return favorites.some(f => f.event_id === eventId);
  };

  const toggleFavorite = (event: FavoriteEvent) => {
    if (isFavorite(event.event_id)) {
      removeFavorite(event.event_id);
    } else {
      addFavorite(event);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
};
