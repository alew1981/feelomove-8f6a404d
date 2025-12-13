// Web Vitals monitoring for Core Web Vitals (LCP, FID, CLS, INP, TTFB)

interface WebVitalsMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB' | 'FCP';
  value: number;
  delta: number;
  id: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

type ReportCallback = (metric: WebVitalsMetric) => void;

// Thresholds for Core Web Vitals
const thresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
};

function getRating(name: keyof typeof thresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Observe Largest Contentful Paint
function observeLCP(callback: ReportCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      
      callback({
        name: 'LCP',
        value: lastEntry.startTime,
        delta: lastEntry.startTime,
        id: `lcp-${Date.now()}`,
        rating: getRating('LCP', lastEntry.startTime),
      });
    });
    
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP observation failed:', e);
  }
}

// Observe First Input Delay
function observeFID(callback: ReportCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number };
      
      const value = firstEntry.processingStart - firstEntry.startTime;
      
      callback({
        name: 'FID',
        value,
        delta: value,
        id: `fid-${Date.now()}`,
        rating: getRating('FID', value),
      });
    });
    
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID observation failed:', e);
  }
}

// Observe Cumulative Layout Shift
function observeCLS(callback: ReportCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;
  
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      });
      
      callback({
        name: 'CLS',
        value: clsValue,
        delta: clsValue,
        id: `cls-${Date.now()}`,
        rating: getRating('CLS', clsValue),
      });
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS observation failed:', e);
  }
}

// Observe Interaction to Next Paint (INP)
function observeINP(callback: ReportCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;
  
  let maxINP = 0;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry: any) => {
        const inp = entry.duration;
        if (inp > maxINP) {
          maxINP = inp;
          callback({
            name: 'INP',
            value: inp,
            delta: inp,
            id: `inp-${Date.now()}`,
            rating: getRating('INP', inp),
          });
        }
      });
    });
    
    // Use type assertion for durationThreshold which is valid but not in all TS definitions
    observer.observe({ type: 'event', buffered: true } as PerformanceObserverInit);
  } catch (e) {
    console.warn('INP observation failed:', e);
  }
}

// Observe Time to First Byte
function observeTTFB(callback: ReportCallback): void {
  try {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      
      callback({
        name: 'TTFB',
        value: ttfb,
        delta: ttfb,
        id: `ttfb-${Date.now()}`,
        rating: getRating('TTFB', ttfb),
      });
    }
  } catch (e) {
    console.warn('TTFB observation failed:', e);
  }
}

// Observe First Contentful Paint
function observeFCP(callback: ReportCallback): void {
  if (typeof PerformanceObserver === 'undefined') return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        callback({
          name: 'FCP',
          value: fcpEntry.startTime,
          delta: fcpEntry.startTime,
          id: `fcp-${Date.now()}`,
          rating: getRating('FCP', fcpEntry.startTime),
        });
      }
    });
    
    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    console.warn('FCP observation failed:', e);
  }
}

// Main function to start observing all Web Vitals
export function observeWebVitals(callback: ReportCallback): void {
  // Wait for page load
  if (document.readyState === 'complete') {
    startObserving(callback);
  } else {
    window.addEventListener('load', () => startObserving(callback));
  }
}

function startObserving(callback: ReportCallback): void {
  observeLCP(callback);
  observeFID(callback);
  observeCLS(callback);
  observeINP(callback);
  observeTTFB(callback);
  observeFCP(callback);
}

// Log Web Vitals to console in development
export function logWebVitals(): void {
  observeWebVitals((metric) => {
    const color = metric.rating === 'good' ? '#00FF8F' : 
                  metric.rating === 'needs-improvement' ? '#FFA500' : '#FF0000';
    
    console.log(
      `%c${metric.name}: ${metric.value.toFixed(2)}ms [${metric.rating}]`,
      `color: ${color}; font-weight: bold;`
    );
  });
}

// Send Web Vitals to analytics (GTM, Matomo, etc.)
export function sendWebVitalsToAnalytics(): void {
  observeWebVitals((metric) => {
    // Send to Google Analytics via GTM dataLayer
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'web_vitals',
        metric_name: metric.name,
        metric_value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_id: metric.id,
      });
    }
    
    // Log in development
    if (import.meta.env.DEV) {
      const color = metric.rating === 'good' ? '#00FF8F' : 
                    metric.rating === 'needs-improvement' ? '#FFA500' : '#FF0000';
      console.log(
        `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms [${metric.rating}]`,
        `color: ${color}; font-weight: bold;`
      );
    }
  });
}
