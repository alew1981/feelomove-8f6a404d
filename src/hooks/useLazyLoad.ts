import { useEffect, useRef, useState, useCallback } from 'react';

interface UseLazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

/**
 * Hook for lazy loading with IntersectionObserver
 * Perfect for loading images when they're about to enter viewport
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: UseLazyLoadOptions = {}
): {
  ref: React.RefObject<T>;
  isInView: boolean;
  hasLoaded: boolean;
} {
  const { 
    rootMargin = '200px', // Load 200px before entering viewport
    threshold = 0,
    triggerOnce = true 
  } = options;

  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip if already loaded and triggerOnce is true
    if (hasLoaded && triggerOnce) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setHasLoaded(true);
            if (triggerOnce) {
              observer.unobserve(element);
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [rootMargin, threshold, triggerOnce, hasLoaded]);

  return { ref: ref as React.RefObject<T>, isInView, hasLoaded };
}

/**
 * Hook for lazy loading multiple items in a list
 * Returns a callback ref to attach to each item
 */
export function useLazyLoadList(
  options: UseLazyLoadOptions = {}
): {
  observerCallback: (node: HTMLElement | null, index: number) => void;
  loadedItems: Set<number>;
} {
  const { 
    rootMargin = '200px',
    threshold = 0 
  } = options;

  const [loadedItems, setLoadedItems] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<HTMLElement, number>>(new Map());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = elementsRef.current.get(entry.target as HTMLElement);
            if (index !== undefined) {
              setLoadedItems((prev) => new Set([...prev, index]));
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin, threshold }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [rootMargin, threshold]);

  const observerCallback = useCallback((node: HTMLElement | null, index: number) => {
    if (node && observerRef.current) {
      elementsRef.current.set(node, index);
      observerRef.current.observe(node);
    }
  }, []);

  return { observerCallback, loadedItems };
}

export default useLazyLoad;
