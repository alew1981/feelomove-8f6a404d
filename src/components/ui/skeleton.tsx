import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Enable shimmer animation (default) or use simple pulse */
  shimmer?: boolean;
  /** Use for text-matching skeletons with proper line-height */
  variant?: 'default' | 'title' | 'subtitle' | 'body';
}

/**
 * CLS-optimized Skeleton component with shimmer effect
 * 
 * Shimmer uses zinc-800 to zinc-700 gradient in dark mode for elegance
 * Variant props match real typography dimensions to prevent layout shift
 */
function Skeleton({ 
  className, 
  shimmer = true, 
  variant = 'default',
  ...props 
}: SkeletonProps) {
  const variantClasses = {
    default: '',
    title: 'h-7 rounded-md', // matches text-xl line-height (1.75rem)
    subtitle: 'h-5 rounded', // matches text-sm line-height (1.25rem) 
    body: 'h-4 rounded', // matches text-base line-height (1rem)
  };

  return (
    <div 
      className={cn(
        "bg-muted",
        shimmer ? "animate-shimmer" : "animate-pulse",
        variant !== 'default' ? variantClasses[variant] : "rounded-md",
        className
      )} 
      {...props} 
    />
  );
}

export { Skeleton };
