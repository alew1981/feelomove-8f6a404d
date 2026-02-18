import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export interface TicketOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  fees: number;
  status: "available" | "limited" | "sold-out";
  isVip?: boolean;
}

interface TicketSelectorProps {
  title?: string;
  subtitle?: string;
  tickets: TicketOption[];
  quantities: Record<string, number>;
  onQuantityChange: (id: string, delta: number) => void;
  maxPerTicket?: number;
  initialVisible?: number;
  completed?: boolean;
}

const TicketSelector = ({
  title,
  subtitle,
  tickets,
  quantities,
  onQuantityChange,
  maxPerTicket = 10,
  initialVisible = 4,
  completed = false,
}: TicketSelectorProps) => {
  const { t } = useTranslation();
  const resolvedTitle = title || t("Selecciona tus entradas");
  const resolvedSubtitle = subtitle || t("¡Entradas añadidas! Ahora elige tu alojamiento");
  const [expanded, setExpanded] = useState(false);

  const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const hasSelection = totalSelected > 0;
  const visibleTickets = expanded ? tickets : tickets.slice(0, initialVisible);
  const hiddenCount = tickets.length - initialVisible;
  const showToggle = tickets.length > initialVisible;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
              hasSelection
                ? "bg-accent text-accent-foreground"
                : "bg-foreground text-background"
            )}
          >
            {hasSelection ? <Check className="h-4 w-4" /> : "1"}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{resolvedTitle}</h2>
            {completed && (
              <p className="text-sm text-accent flex items-center gap-1 mt-0.5">
                <Check className="h-3 w-3" />
                {resolvedSubtitle}
              </p>
            )}
          </div>
        </div>
        {hasSelection && (
          <span className="text-sm font-bold text-accent">
            {totalSelected} {totalSelected === 1 ? t("entrada") : t("entradas")}
          </span>
        )}
      </div>

      {/* Ticket Cards */}
      <div className="flex flex-col gap-3">
        {visibleTickets.map((ticket) => {
          const qty = quantities[ticket.id] || 0;
          const isSoldOut = ticket.status === "sold-out";
          const isLimited = ticket.status === "limited";
          const isSelected = qty > 0;

          return (
            <div
              key={ticket.id}
              className={cn(
                "relative rounded-xl border-2 p-4 transition-all",
                isSoldOut
                  ? "border-muted bg-muted/30"
                  : isSelected
                    ? "border-accent shadow-lg shadow-accent/10"
                    : "border-border hover:border-accent/40 bg-card"
              )}
            >
              {/* Check icon for selected */}
              {isSelected && !isSoldOut && (
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-accent-foreground" />
                </div>
              )}

              {/* Top row: Name + Badge */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {ticket.isVip && (
                    <span className="text-[10px] font-bold text-background bg-foreground px-2 py-0.5 rounded shrink-0">
                      VIP
                    </span>
                  )}
                  <p
                    className={cn(
                      "text-sm sm:text-base font-bold uppercase line-clamp-2",
                      isSoldOut ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {ticket.description && ticket.description !== ticket.name
                      ? `${ticket.description} (${ticket.name})`
                      : ticket.name}
                  </p>
                </div>
                <div className="shrink-0 mt-0.5">
                  {isSoldOut ? (
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded">
                      {t('AGOTADO')}
                    </span>
                  ) : isLimited ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 dark:text-amber-200 dark:bg-amber-900/50 dark:border-amber-700">
                      {t('ÚLTIMAS')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-accent-foreground bg-accent px-2.5 py-0.5 rounded">
                      {t('DISPONIBLE')}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom row: Price + Controls */}
              <div className="flex items-end justify-between gap-2">
                <div>
                  <span
                    className={cn(
                      "text-2xl sm:text-3xl font-black",
                      isSoldOut ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {ticket.price.toFixed(0)}€
                  </span>
                  {ticket.fees > 0 && (
                    <p
                      className={cn(
                        "text-xs mt-0.5",
                        isSoldOut ? "text-muted-foreground/60" : "text-muted-foreground"
                      )}
                    >
                      + {ticket.fees.toFixed(2)}€ {t('gastos')}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1">
                  {/* Quantity controls */}
                  <div
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2 rounded-full p-1",
                      "bg-muted/50"
                    )}
                  >
                    <button
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-colors",
                        isSoldOut || qty === 0
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : "hover:bg-background text-foreground"
                      )}
                      onClick={() => onQuantityChange(ticket.id, -1)}
                      disabled={qty === 0 || isSoldOut}
                      aria-label={`Reducir cantidad de ${ticket.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span
                      className={cn(
                        "w-7 text-center font-bold text-lg",
                        isSoldOut ? "text-muted-foreground/60" : "text-foreground"
                      )}
                    >
                      {qty}
                    </span>
                    <button
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-colors",
                        isSoldOut || qty >= maxPerTicket
                          ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                          : "bg-accent text-accent-foreground hover:bg-accent/80"
                      )}
                      onClick={() => onQuantityChange(ticket.id, 1)}
                      disabled={qty >= maxPerTicket || isSoldOut}
                      aria-label={`Aumentar cantidad de ${ticket.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ver más toggle */}
      {showToggle && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 text-sm font-bold uppercase text-accent hover:text-accent/80 transition-colors"
        >
          {expanded ? (
            <>
              {t('VER MENOS')}
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              {t('VER')} {hiddenCount} {t('MÁS')}
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default TicketSelector;
