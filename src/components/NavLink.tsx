import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePrefetch } from "@/hooks/usePrefetch";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  onMouseEnter?: () => void;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter: externalOnMouseEnter, ...props }, ref) => {
    const { prefetch } = usePrefetch();
    
    const handleMouseEnter = useCallback(() => {
      if (typeof to === "string") {
        prefetch(to);
      }
      externalOnMouseEnter?.();
    }, [to, prefetch, externalOnMouseEnter]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
