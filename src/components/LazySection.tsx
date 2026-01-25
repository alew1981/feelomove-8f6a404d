import { lazy, Suspense, useRef, useState, useEffect, ReactNode, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string;
}

/**
 * LazySection - IntersectionObserver-based lazy loading wrapper
 * Only renders children when the section enters the viewport
 * Perfect for below-the-fold components to reduce initial JS bundle
 */
export const LazySection = ({ 
  children, 
  fallback,
  rootMargin = '200px',
  minHeight = '300px'
}: LazySectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If already visible, don't set up observer
    if (isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, isVisible]);

  const defaultFallback = (
    <div style={{ minHeight }} className="animate-pulse bg-muted/30 rounded-xl" />
  );

  return (
    <div ref={ref} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
      {isVisible ? children : (fallback || defaultFallback)}
    </div>
  );
};

interface LazyComponentProps<T extends ComponentType<any>> {
  loader: () => Promise<{ default: T }>;
  props: React.ComponentProps<T>;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string;
}

/**
 * LazyComponent - Combines React.lazy with IntersectionObserver
 * Loads the component code only when it's about to enter the viewport
 */
export function LazyComponent<T extends ComponentType<any>>({
  loader,
  props,
  fallback,
  rootMargin = '200px',
  minHeight = '300px'
}: LazyComponentProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [Component, setComponent] = useState<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, isVisible]);

  // Load component when visible
  useEffect(() => {
    if (isVisible && !Component) {
      loader().then((mod) => setComponent(() => mod.default));
    }
  }, [isVisible, loader, Component]);

  const defaultFallback = (
    <div style={{ minHeight }} className="animate-pulse bg-muted/30 rounded-xl" />
  );

  if (!isVisible) {
    return (
      <div ref={ref} style={{ minHeight }}>
        {fallback || defaultFallback}
      </div>
    );
  }

  if (!Component) {
    return (
      <div ref={ref} style={{ minHeight }}>
        {fallback || defaultFallback}
      </div>
    );
  }

  return (
    <div ref={ref}>
      <Component {...props} />
    </div>
  );
}

export default LazySection;
