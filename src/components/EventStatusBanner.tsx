import { AlertCircle, Calendar, XCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type EventStatusType = 'cancelled' | 'rescheduled' | 'past' | 'scheduled';

interface EventStatusBannerProps {
  status: EventStatusType;
  eventName?: string;
  eventDate?: string;
  className?: string;
}

/**
 * Visual banner component to inform users about event status
 * Used for cancelled, rescheduled, or past events while keeping pages accessible for SEO
 */
export const EventStatusBanner = ({ 
  status, 
  eventName,
  eventDate,
  className 
}: EventStatusBannerProps) => {
  if (status === 'scheduled') return null;

  const config = {
    cancelled: {
      icon: XCircle,
      title: 'Evento Cancelado',
      description: 'Este evento ha sido cancelado. Te recomendamos explorar otros eventos similares.',
      variant: 'destructive' as const,
      bgClass: 'bg-destructive/10 border-destructive/50',
      iconClass: 'text-destructive',
    },
    rescheduled: {
      icon: Clock,
      title: 'Evento Reprogramado',
      description: 'Este evento ha sido reprogramado. Consulta las nuevas fechas a continuación.',
      variant: 'default' as const,
      bgClass: 'bg-amber-500/10 border-amber-500/50',
      iconClass: 'text-amber-500',
    },
    past: {
      icon: Calendar,
      title: 'Evento Finalizado',
      description: 'Este evento ya ha tenido lugar. Explora próximos eventos similares.',
      variant: 'default' as const,
      bgClass: 'bg-muted border-muted-foreground/30',
      iconClass: 'text-muted-foreground',
    },
  };

  const { icon: Icon, title, description, bgClass, iconClass } = config[status];

  return (
    <Alert className={cn(bgClass, 'mb-6', className)}>
      <Icon className={cn('h-5 w-5', iconClass)} />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        {description}
        {status === 'past' && eventName && (
          <span className="block mt-1 text-sm">
            ¿Buscas eventos similares? <a href="/conciertos" className="text-accent hover:underline">Ver próximos conciertos</a>
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};

/**
 * Helper function to determine event status
 */
export const getEventStatus = (
  cancelled: boolean | null | undefined,
  rescheduled: boolean | null | undefined,
  eventDate: string | null | undefined
): EventStatusType => {
  if (cancelled) return 'cancelled';
  if (rescheduled) return 'rescheduled';
  
  // Check if event has passed (only for valid dates, not placeholder dates)
  if (eventDate && !eventDate.startsWith('9999')) {
    const eventDateTime = new Date(eventDate);
    const now = new Date();
    if (eventDateTime < now) return 'past';
  }
  
  return 'scheduled';
};
