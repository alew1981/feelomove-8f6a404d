import { Badge } from "./ui/badge";
import { Calendar, MapPin, Music } from "lucide-react";

interface StatsBadgeProps {
  type: 'events' | 'cities' | 'genres';
  count: number;
}

const iconMap = {
  events: Calendar,
  cities: MapPin,
  genres: Music,
};

const labelMap = {
  events: 'eventos',
  cities: 'ciudades',
  genres: 'géneros',
};

export const StatsBadge = ({ type, count }: StatsBadgeProps) => {
  const Icon = iconMap[type];
  const label = labelMap[type];
  
  return (
    <Badge variant="secondary" className="text-sm px-4 py-2">
      <Icon className="h-4 w-4 mr-2" />
      <span className="font-bold">{count}</span>
      <span className="ml-1 text-muted-foreground">{label}</span>
    </Badge>
  );
};
