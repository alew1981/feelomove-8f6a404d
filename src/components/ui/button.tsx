import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-wide ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F]/90 shadow-md hover:shadow-lg rounded-md",
        primary: "bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F]/90 shadow-md hover:shadow-lg rounded-md",
        add: "bg-[#00FF8F] text-[#121212] hover:bg-[#00FF8F]/90 shadow-sm hover:shadow-md rounded-md text-xs px-4 py-2",
        outline: "border-2 border-[#121212] bg-transparent text-[#121212] hover:bg-[#121212] hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-[#121212] rounded-md",
        destructive: "bg-[#FF0000] text-white hover:bg-[#FF0000]/90 shadow-sm hover:shadow-md rounded-md",
        secondary: "bg-[#F2F2F2] text-[#121212] hover:bg-[#F2F2F2]/80 shadow-sm hover:shadow-md rounded-md",
        ghost: "hover:bg-[#00FF8F]/10 hover:text-[#00FF8F] rounded-md",
        link: "text-[#00FF8F] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
