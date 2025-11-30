import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Hotel } from "lucide-react";

interface ToggleWithHotelsProps {
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export const ToggleWithHotels = ({ value, onChange, className = '' }: ToggleWithHotelsProps) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Switch
        id="with-hotels"
        checked={value}
        onCheckedChange={onChange}
      />
      <Label
        htmlFor="with-hotels"
        className="flex items-center gap-2 cursor-pointer text-sm font-medium"
      >
        <Hotel className="h-4 w-4" />
        Solo con Hotel Disponible
      </Label>
    </div>
  );
};
