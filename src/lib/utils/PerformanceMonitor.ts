/**
 * Simple performance monitoring utility for debugging
 */
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();
  private static enabled = false; // Set to true for debugging
  
  static start(label: string): void {
    if (!this.enabled) return;
    this.timers.set(label, performance.now());
  }
  
  static end(label: string): number | null {
    if (!this.enabled) return null;
    
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Performance timer '${label}' was not started`);
      return null;
    }
    
    const duration = performance.now() - startTime;
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    this.timers.delete(label);
    return duration;
  }
  
  static enable(): void {
    this.enabled = true;
    console.log('🔍 Performance monitoring enabled');
  }
  
  static disable(): void {
    this.enabled = false;
    this.timers.clear();
  }
}
