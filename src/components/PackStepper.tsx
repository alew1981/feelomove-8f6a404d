import { Check, Ticket, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PackStepperProps {
  currentStep: 1 | 2;
  ticketsSelected: boolean;
  hotelSelected: boolean;
}

const PackStepper = ({ currentStep, ticketsSelected, hotelSelected }: PackStepperProps) => {
  return (
    <div className="bg-card border-b border-border sticky top-16 z-30 py-2 px-4 -mx-4 mb-4 md:relative md:top-0 md:z-0 md:bg-transparent md:border-0 md:mb-6 md:px-0">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {/* Step 1: Entradas */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={cn(
            "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all",
            ticketsSelected 
              ? "bg-accent text-accent-foreground" 
              : currentStep === 1 
                ? "bg-foreground text-background ring-2 ring-accent ring-offset-2 ring-offset-background" 
                : "bg-muted text-muted-foreground"
          )}>
            {ticketsSelected ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <span>1</span>}
          </div>
          <div className="flex items-center gap-1">
            <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hidden xs:block" />
            <span className={cn(
              "text-xs sm:text-sm font-medium transition-colors",
              ticketsSelected ? "text-accent" : currentStep === 1 ? "text-foreground" : "text-muted-foreground"
            )}>
              Entradas
            </span>
          </div>
        </div>

        {/* Connector */}
        <div className={cn(
          "w-8 sm:w-16 h-0.5 transition-colors",
          ticketsSelected ? "bg-accent" : "bg-border"
        )} />

        {/* Step 2: Hotel */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={cn(
            "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all",
            hotelSelected 
              ? "bg-accent text-accent-foreground" 
              : currentStep === 2 
                ? "bg-foreground text-background ring-2 ring-accent ring-offset-2 ring-offset-background" 
                : "bg-muted text-muted-foreground"
          )}>
            {hotelSelected ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : <span>2</span>}
          </div>
          <div className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground hidden xs:block" />
            <span className={cn(
              "text-xs sm:text-sm font-medium transition-colors",
              hotelSelected ? "text-accent" : currentStep === 2 ? "text-foreground" : "text-muted-foreground"
            )}>
              Hotel
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackStepper;
