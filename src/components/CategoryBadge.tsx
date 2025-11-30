import { Badge } from "./ui/badge";
import { Music, Users } from "lucide-react";

interface CategoryBadgeProps {
  badges?: string[];
  className?: string;
}

export const CategoryBadge = ({ badges = [], className }: CategoryBadgeProps) => {
  // Detectar si es concierto o festival basado en event_badges
  const isConcert = badges.some(b => b.toLowerCase().includes('concert'));
  const isFestival = badges.some(b => b.toLowerCase().includes('festival'));
  
  if (isFestival) {
    return (
      <Badge variant="default" className={`bg-purple-600 text-white hover:bg-purple-700 ${className}`}>
        <Users className="h-3 w-3 mr-1" />
        Festival
      </Badge>
    );
  }
  
  if (isConcert) {
    return (
      <Badge variant="default" className={`bg-blue-600 text-white hover:bg-blue-700 ${className}`}>
        <Music className="h-3 w-3 mr-1" />
        Concierto
      </Badge>
    );
  }
  
  return null;
};
