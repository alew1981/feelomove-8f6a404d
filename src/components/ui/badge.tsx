import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        hot: "bg-[#FF0000] text-white shadow-md",
        vip: "bg-[#FFD700] text-[#121212] shadow-md",
        popular: "bg-[#00FF8F] text-[#121212] shadow-md",
        limitado: "bg-[#FF8000] text-white shadow-md",
        agotado: "bg-[#999999] text-white",
        verificado: "bg-[#3B82F6] text-white shadow-sm",
        disponible: "bg-[#00FF8F] text-[#121212]",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-border text-foreground bg-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
