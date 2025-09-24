import { ReportHandler, Metric } from 'web-vitals';

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters: any) => void;
  }
}

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
  FID: { good: 100, poor: 300 },        // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }       // Time to First Byte
};

type PerformanceRating = 'good' | 'needs-improvement' | 'poor';

// Enhanced performance handler with detailed logging and categorization
const performanceHandler = (metric: Metric) => {
  const { name, value, delta } = metric;
  
  // Get performance category
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  let category: PerformanceRating = 'needs-improvement';
  
  if (threshold) {
    if (name === 'CLS') {
      // CLS uses different scale (0-1 instead of milliseconds)
      category = value <= threshold.good ? 'good' : value <= threshold.poor ? 'needs-improvement' : 'poor';
    } else {
      category = value <= threshold.good ? 'good' : value <= threshold.poor ? 'needs-improvement' : 'poor';
    }
  }

  // Format value for display
  const formattedValue = name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`;
  
  // Color coding for console output
  const colors: Record<PerformanceRating, string> = {
    good: '🟢',
    'needs-improvement': '🟡', 
    poor: '🔴'
  };

  // Log to console with styling
  console.group(`${colors[category]} Performance Metric: ${name}`);
  console.log(`Value: ${formattedValue}`);
  console.log(`Category: ${category}`);
  console.log(`Delta: ${name === 'CLS' ? delta.toFixed(3) : Math.round(delta)}${name === 'CLS' ? '' : 'ms'}`);
  
  // Add context for each metric
  switch (name) {
    case 'FCP':
      console.log('📊 First Contentful Paint - How quickly content appears');
      break;
    case 'LCP':
      console.log('📊 Largest Contentful Paint - Main content loading time');
      break;
    case 'FID':
      console.log('📊 First Input Delay - Responsiveness to user input');
      break;
    case 'CLS':
      console.log('📊 Cumulative Layout Shift - Visual stability');
      break;
    case 'TTFB':
      console.log('📊 Time to First Byte - Server response time');
      break;
  }

  // Performance recommendations
  if (category === 'poor') {
    console.warn('⚠️ Consider optimizing this metric for better user experience');
  } else if (category === 'needs-improvement') {
    console.info('💡 This metric could be improved');
  } else {
    console.log('✅ Good performance for this metric');
  }
  
  console.groupEnd();

  // Send to analytics if available (you can integrate with your preferred service)
  if (window.gtag) {
    // Google Analytics 4 example
    window.gtag('event', 'web_vital', {
      custom_parameter_1: name,
      custom_parameter_2: Math.round(name === 'CLS' ? value * 1000 : value),
      custom_parameter_3: category
    });
  }

  // Store in localStorage for debugging (last 10 metrics)
  try {
    const stored = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    stored.push({
      name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      category,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 measurements per metric type
    const filtered = stored.slice(-50); // Keep last 50 total measurements
    localStorage.setItem('performance_metrics', JSON.stringify(filtered));
  } catch (e) {
    console.warn('Could not store performance metrics to localStorage:', e);
  }
};

// Enhanced reportWebVitals function
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  // Use custom handler if none provided
  const handler = onPerfEntry || performanceHandler;
  
  if (handler && typeof handler === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(handler);
      getFID(handler);
      getFCP(handler);
      getLCP(handler);
      getTTFB(handler);
    }).catch((error) => {
      console.warn('Failed to load web-vitals:', error);
    });
  }
};

// Helper function to get stored performance data
export const getPerformanceMetrics = () => {
  try {
    return JSON.parse(localStorage.getItem('performance_metrics') || '[]');
  } catch (e) {
    return [];
  }
};

// Helper function to clear stored performance data
export const clearPerformanceMetrics = () => {
  try {
    localStorage.removeItem('performance_metrics');
    console.log('Performance metrics cleared');
  } catch (e) {
    console.warn('Could not clear performance metrics:', e);
  }
};

// Make helper functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).getPerformanceMetrics = getPerformanceMetrics;
  (window as any).clearPerformanceMetrics = clearPerformanceMetrics;
}

export default reportWebVitals;
