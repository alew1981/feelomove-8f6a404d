import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface CartTicket {
  type: string;
  description?: string;
  price: number;
  fees: number;
  quantity: number;
}

export interface CartHotel {
  hotel_id: string;
  hotel_name: string;
  nights: number;
  price_per_night: number;
  total_price: number;
  image: string;
  description: string;
  checkin_date?: string;
  checkout_date?: string;
}

export interface CartItem {
  event_id: string;
  event_name: string;
  event_date: string;
  venue_name: string;
  venue_city: string;
  tickets: CartTicket[];
  hotel?: CartHotel;
}

interface CartContextType {
  cart: CartItem | null;
  addTickets: (eventId: string, eventDetails: any, tickets: CartTicket[]) => void;
  addHotel: (eventId: string, eventDetails: any, hotel: CartHotel) => void;
  removeTicket: (ticketType: string) => void;
  removeHotel: () => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalTickets: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem | null>(() => {
    const saved = localStorage.getItem('feelomove_cart');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (cart) {
      localStorage.setItem('feelomove_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('feelomove_cart');
    }
  }, [cart]);

  // Sync cart across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'feelomove_cart') {
        setCart(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addTickets = (eventId: string, eventDetails: any, tickets: CartTicket[]) => {
    setCart({
      event_id: eventId,
      event_name: eventDetails.event_name,
      event_date: eventDetails.event_date,
      venue_name: eventDetails.venue_name,
      venue_city: eventDetails.venue_city,
      tickets: tickets,
      hotel: cart?.hotel,
    });
  };

  const addHotel = (eventId: string, eventDetails: any, hotel: CartHotel) => {
    setCart(prev => {
      // If no cart or different event, create a new cart with just the hotel
      if (!prev || prev.event_id !== eventId) {
        return {
          event_id: eventId,
          event_name: eventDetails.event_name || '',
          event_date: eventDetails.event_date || '',
          venue_name: eventDetails.venue_name || '',
          venue_city: eventDetails.venue_city || '',
          tickets: [],
          hotel
        };
      }
      return { ...prev, hotel };
    });
  };

  const removeTicket = (ticketType: string) => {
    setCart(prev => {
      if (!prev) return null;
      const updatedTickets = prev.tickets.filter(t => t.type !== ticketType);
      if (updatedTickets.length === 0 && !prev.hotel) return null;
      return { ...prev, tickets: updatedTickets };
    });
  };

  const removeHotel = () => {
    setCart(prev => {
      if (!prev) return null;
      const { hotel, ...rest } = prev;
      if (rest.tickets.length === 0) return null;
      return rest;
    });
  };

  const clearCart = () => setCart(null);

  const getTotalPrice = () => {
    if (!cart) return 0;
    const ticketsTotal = cart.tickets.reduce((sum, t) => sum + (t.price + t.fees) * t.quantity, 0);
    const hotelTotal = cart.hotel ? cart.hotel.total_price : 0;
    return ticketsTotal + hotelTotal;
  };

  const getTotalTickets = () => {
    if (!cart) return 0;
    return cart.tickets.reduce((sum, t) => sum + t.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addTickets,
        addHotel,
        removeTicket,
        removeHotel,
        clearCart,
        getTotalPrice,
        getTotalTickets,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
