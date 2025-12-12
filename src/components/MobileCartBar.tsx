import { useState } from "react";
import { ShoppingCart, ChevronUp, ChevronDown, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface MobileCartBarProps {
  eventUrl?: string;
  hotelUrl?: string;
  eventName?: string;
}

const MobileCartBar = ({ eventUrl, hotelUrl, eventName }: MobileCartBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { cart, removeTicket, removeHotel, getTotalPrice, getTotalTickets } = useCart();

  const totalTickets = getTotalTickets();
  const totalPrice = getTotalPrice();
  const pricePerPerson = totalTickets > 0 ? totalPrice / totalTickets : 0;

  if (!cart || totalTickets === 0) return null;

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Mobile Cart Bar */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-300 ease-in-out",
        isExpanded ? "h-auto max-h-[80vh]" : "h-auto"
      )}>
        <div className="bg-card border-t-2 border-accent shadow-2xl rounded-t-2xl overflow-hidden">
          {/* Collapsed Bar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between bg-foreground text-background"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalTickets}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs opacity-80">Tu reserva</p>
                <p className="font-bold text-sm">{eventName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-black text-accent">€{totalPrice.toFixed(2)}</p>
                <p className="text-xs opacity-80">€{pricePerPerson.toFixed(2)}/persona</p>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </div>
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="max-h-[60vh] overflow-y-auto bg-card">
              <div className="p-4 space-y-3">
                {/* Tickets */}
                {cart.tickets.map((ticket, idx) => (
                  <div key={idx} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{ticket.type}</h3>
                        <p className="text-xs text-muted-foreground">
                          {ticket.quantity} x €{(ticket.price + ticket.fees).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          €{((ticket.price + ticket.fees) * ticket.quantity).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeTicket(ticket.type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Hotel */}
                {cart.hotel && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{cart.hotel.hotel_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {cart.hotel.nights} noches
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          €{cart.hotel.total_price.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={removeHotel}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total ({totalTickets} personas)</span>
                    <span className="font-bold">€{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Por persona</span>
                    <span className="font-black text-accent text-lg">€{pricePerPerson.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full h-12 text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/90"
                    asChild
                  >
                    <a href={eventUrl || "#"} target="_blank" rel="noopener noreferrer">
                      Reservar Entradas
                    </a>
                  </Button>
                  {cart.hotel && hotelUrl && (
                    <Button
                      variant="outline"
                      className="w-full h-12 text-sm font-bold border-2"
                      asChild
                    >
                      <a href={hotelUrl} target="_blank" rel="noopener noreferrer">
                        Reservar Hotel
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileCartBar;
