import { useState } from "react";
import { ShoppingCart, ChevronUp, ChevronDown, Trash2, Check, Building2, Ticket, ArrowDown } from "lucide-react";
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
  const hasHotel = !!cart?.hotel;
  const hasTickets = totalTickets > 0;
  const hasItems = hasTickets || hasHotel;
  const pricePerPerson = totalTickets > 0 ? totalPrice / totalTickets : (hasHotel ? totalPrice : 0);

  // Show cart bar if there are any items (tickets OR hotel)
  if (!cart || !hasItems) return null;

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Mobile Cart Bar */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 xl:hidden transition-all duration-300 ease-in-out",
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
                {(hasTickets || hasHotel) && (
                  <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {hasTickets ? totalTickets : (hasHotel ? 1 : 0)}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                    hasTickets ? "bg-accent/20 text-accent" : "bg-white/10 text-white/60"
                  )}>
                    <Ticket className="h-3 w-3" />
                    {hasTickets ? <Check className="h-3 w-3" /> : <span className="text-[10px]">?</span>}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                    hasHotel ? "bg-accent/20 text-accent" : "bg-white/10 text-white/60"
                  )}>
                    <Building2 className="h-3 w-3" />
                    {hasHotel ? <Check className="h-3 w-3" /> : <span className="text-[10px]">?</span>}
                  </div>
                </div>
                <p className="font-bold text-sm mt-1 line-clamp-1">{eventName}</p>
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

                {hasHotel && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" />
                    <p className="text-xs text-foreground font-medium">
                      ¡Pack completo! Entradas + Hotel
                    </p>
                  </div>
                )}

                {/* Tickets */}
                {cart.tickets.map((ticket, idx) => (
                  <div key={idx} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Ticket className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] uppercase text-muted-foreground font-medium">Entrada</span>
                        </div>
                        <h3 className="font-bold text-sm uppercase line-clamp-2">{ticket.description || ticket.type}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.quantity} x €{(ticket.price + ticket.fees).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                        <div className="flex items-center gap-1.5 mb-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] uppercase text-muted-foreground font-medium">Hotel</span>
                        </div>
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
                  {hasTickets && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Por persona</span>
                      <span className="font-bold text-foreground">€{pricePerPerson.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Total{hasTickets ? ` (${totalTickets} personas)` : ''}
                    </span>
                    <span className="font-black text-accent text-lg">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {hasTickets && (
                    <Button
                      className="w-full h-12 text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/90"
                      asChild
                    >
                      <a href={eventUrl || "#"} target="_blank" rel="noopener noreferrer">
                        Reservar Entradas
                      </a>
                    </Button>
                  )}
                  {cart.hotel && hotelUrl && (
                    <Button
                      variant={hasTickets ? "outline" : "default"}
                      className={cn(
                        "w-full h-12 text-sm font-bold",
                        hasTickets ? "border-2" : "bg-accent text-accent-foreground hover:bg-accent/90"
                      )}
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
