import { useRef, useCallback } from 'react';

/**
 * Throttle hook to limit function execution frequency
 * @param callback - Function to throttle
 * @param delay - Minimum time between executions in ms
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        lastRun.current = now;
        return callback(...args);
      } else {
        // Schedule execution for remaining time
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Debounce hook to delay function execution until after pause in calls
 * @param callback - Function to debounce
 * @param delay - Time to wait after last call before executing
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

export default useThrottle;
