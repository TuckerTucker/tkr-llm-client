/**
 * Performance Monitoring Hook
 *
 * Provides utilities for tracking and measuring UI performance metrics
 * including render times, layout calculations, memory usage, and FPS.
 *
 * @module hooks/usePerformance
 * @version 1.0.0
 * @author Performance Optimization Engineer (Agent 2)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { LayoutAlgorithm } from './useAutoLayout';

/**
 * Performance metrics tracked by the hook
 */
export interface PerformanceMetrics {
  /** Average component render time (ms) */
  renderTime: number;

  /** Last layout calculation time (ms) */
  layoutTime: number;

  /** Last template conversion time (ms) */
  conversionTime: number;

  /** Current memory usage (MB) */
  memoryUsage: number;

  /** Current frames per second */
  fps: number;

  /** Time to first render (ms) */
  timeToFirstRender: number;

  /** Number of re-renders */
  renderCount: number;
}

/**
 * Performance measurement data
 */
interface PerformanceMeasurement {
  operation: string;
  duration: number;
  timestamp: number;
}

/**
 * Render measurement record
 */
interface RenderRecord {
  componentName: string;
  duration: number;
  timestamp: number;
}

/**
 * FPS tracker state
 */
interface FPSTracker {
  frames: number;
  lastTime: number;
  currentFPS: number;
}

/**
 * Hook options
 */
export interface UsePerformanceOptions {
  /** Whether to enable performance tracking (default: true in dev) */
  enabled?: boolean;

  /** Threshold for slow operation warnings (ms, default: 100) */
  slowOperationThreshold?: number;

  /** Whether to track FPS (default: false, can be expensive) */
  trackFPS?: boolean;

  /** Whether to track memory (default: true) */
  trackMemory?: boolean;

  /** Sample size for averaging (default: 10) */
  sampleSize?: number;
}

const DEFAULT_OPTIONS: Required<UsePerformanceOptions> = {
  enabled: process.env.NODE_ENV === 'development',
  slowOperationThreshold: 100,
  trackFPS: false,
  trackMemory: true,
  sampleSize: 10,
};

/**
 * Performance monitoring hook
 *
 * Tracks render times, layout calculations, conversions, memory usage, and FPS.
 * Provides utilities for measuring and logging performance metrics.
 *
 * @param options - Hook configuration options
 * @returns Performance tracking utilities and current metrics
 *
 * @example
 * ```typescript
 * const { measureRender, measureLayout, metrics } = usePerformance();
 *
 * // Measure render time
 * const cleanup = measureRender('MyComponent');
 * // ... render logic ...
 * cleanup();
 *
 * // Measure layout
 * measureLayout('dagre', 50);
 * // ... layout calculation ...
 * const duration = measureLayout.end();
 * ```
 */
export function usePerformance(options: UsePerformanceOptions = {}): {
  measureRender: (componentName: string) => () => void;
  measureLayout: (algorithm: LayoutAlgorithm, nodeCount: number) => () => number;
  measureConversion: (templateName: string) => () => number;
  getMetrics: () => PerformanceMetrics;
  logSlowOperation: (operation: string, duration: number) => void;
  resetMetrics: () => void;
  metrics: PerformanceMetrics;
  isEnabled: boolean;
} {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Measurement storage
  const renderRecords = useRef<RenderRecord[]>([]);
  const layoutMeasures = useRef<PerformanceMeasurement[]>([]);
  const conversionMeasures = useRef<PerformanceMeasurement[]>([]);
  const fpsTracker = useRef<FPSTracker>({
    frames: 0,
    lastTime: performance.now(),
    currentFPS: 60,
  });

  const firstRenderTime = useRef<number | null>(null);
  const renderCount = useRef(0);

  // Current metrics state
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    layoutTime: 0,
    conversionTime: 0,
    memoryUsage: 0,
    fps: 60,
    timeToFirstRender: 0,
    renderCount: 0,
  });

  /**
   * Measure component render time
   *
   * @param componentName - Name of component being rendered
   * @returns Cleanup function to end measurement
   */
  const measureRender = useCallback(
    (componentName: string): (() => void) => {
      if (!opts.enabled) return () => {};

      const startTime = performance.now();
      renderCount.current++;

      // Track first render
      if (!firstRenderTime.current) {
        firstRenderTime.current = startTime;
      }

      return () => {
        const duration = performance.now() - startTime;

        // Record render
        renderRecords.current.push({
          componentName,
          duration,
          timestamp: Date.now(),
        });

        // Keep only recent records
        if (renderRecords.current.length > opts.sampleSize) {
          renderRecords.current.shift();
        }

        // Log slow renders
        if (duration > opts.slowOperationThreshold) {
          console.warn(
            `[Performance] Slow render: ${componentName} took ${duration.toFixed(2)}ms`
          );
        }

        updateMetrics();
      };
    },
    [opts.enabled, opts.slowOperationThreshold, opts.sampleSize]
  );

  /**
   * Measure layout calculation time
   *
   * @param algorithm - Layout algorithm being used
   * @param nodeCount - Number of nodes being laid out
   * @returns Cleanup function that returns duration
   */
  const measureLayout = useCallback(
    (algorithm: LayoutAlgorithm, nodeCount: number): (() => number) => {
      if (!opts.enabled) return () => 0;

      const startTime = performance.now();

      return () => {
        const duration = performance.now() - startTime;

        // Record layout measurement
        layoutMeasures.current.push({
          operation: `${algorithm} (${nodeCount} nodes)`,
          duration,
          timestamp: Date.now(),
        });

        // Keep only recent measurements
        if (layoutMeasures.current.length > opts.sampleSize) {
          layoutMeasures.current.shift();
        }

        // Log slow layouts
        if (duration > opts.slowOperationThreshold) {
          console.warn(
            `[Performance] Slow layout: ${algorithm} with ${nodeCount} nodes took ${duration.toFixed(2)}ms`
          );
        }

        updateMetrics();
        return duration;
      };
    },
    [opts.enabled, opts.slowOperationThreshold, opts.sampleSize]
  );

  /**
   * Measure template conversion time
   *
   * @param templateName - Name of template being converted
   * @returns Cleanup function that returns duration
   */
  const measureConversion = useCallback(
    (templateName: string): (() => number) => {
      if (!opts.enabled) return () => 0;

      const startTime = performance.now();

      return () => {
        const duration = performance.now() - startTime;

        // Record conversion measurement
        conversionMeasures.current.push({
          operation: `Convert ${templateName}`,
          duration,
          timestamp: Date.now(),
        });

        // Keep only recent measurements
        if (conversionMeasures.current.length > opts.sampleSize) {
          conversionMeasures.current.shift();
        }

        // Log slow conversions
        if (duration > opts.slowOperationThreshold) {
          console.warn(
            `[Performance] Slow conversion: ${templateName} took ${duration.toFixed(2)}ms`
          );
        }

        updateMetrics();
        return duration;
      };
    },
    [opts.enabled, opts.slowOperationThreshold, opts.sampleSize]
  );

  /**
   * Get current performance metrics
   *
   * @returns Current metrics snapshot
   */
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metrics };
  }, [metrics]);

  /**
   * Log a slow operation warning
   *
   * @param operation - Operation name
   * @param duration - Duration in milliseconds
   */
  const logSlowOperation = useCallback(
    (operation: string, duration: number): void => {
      if (!opts.enabled) return;

      if (duration > opts.slowOperationThreshold) {
        console.warn(
          `[Performance] Slow operation: ${operation} took ${duration.toFixed(2)}ms`
        );
      }
    },
    [opts.enabled, opts.slowOperationThreshold]
  );

  /**
   * Reset all performance metrics
   */
  const resetMetrics = useCallback((): void => {
    renderRecords.current = [];
    layoutMeasures.current = [];
    conversionMeasures.current = [];
    firstRenderTime.current = null;
    renderCount.current = 0;

    setMetrics({
      renderTime: 0,
      layoutTime: 0,
      conversionTime: 0,
      memoryUsage: 0,
      fps: 60,
      timeToFirstRender: 0,
      renderCount: 0,
    });
  }, []);

  /**
   * Update metrics based on current measurements
   */
  const updateMetrics = useCallback((): void => {
    if (!opts.enabled) return;

    // Calculate average render time
    const avgRenderTime =
      renderRecords.current.length > 0
        ? renderRecords.current.reduce((sum, r) => sum + r.duration, 0) /
          renderRecords.current.length
        : 0;

    // Get latest layout time
    const latestLayoutTime =
      layoutMeasures.current.length > 0
        ? layoutMeasures.current[layoutMeasures.current.length - 1].duration
        : 0;

    // Get latest conversion time
    const latestConversionTime =
      conversionMeasures.current.length > 0
        ? conversionMeasures.current[conversionMeasures.current.length - 1].duration
        : 0;

    // Get memory usage (if available and tracking enabled)
    let memoryUsage = 0;
    if (opts.trackMemory && 'memory' in performance) {
      const perfMemory = (performance as any).memory;
      if (perfMemory && perfMemory.usedJSHeapSize) {
        memoryUsage = perfMemory.usedJSHeapSize / 1024 / 1024; // Convert to MB
      }
    }

    // Calculate time to first render
    const timeToFirstRender = firstRenderTime.current
      ? firstRenderTime.current - performance.timing.navigationStart
      : 0;

    setMetrics({
      renderTime: avgRenderTime,
      layoutTime: latestLayoutTime,
      conversionTime: latestConversionTime,
      memoryUsage,
      fps: fpsTracker.current.currentFPS,
      timeToFirstRender,
      renderCount: renderCount.current,
    });
  }, [opts.enabled, opts.trackMemory]);

  /**
   * FPS tracking animation frame loop
   */
  const trackFPSFrame = useCallback((): void => {
    if (!opts.trackFPS || !opts.enabled) return;

    fpsTracker.current.frames++;
    const currentTime = performance.now();
    const deltaTime = currentTime - fpsTracker.current.lastTime;

    // Update FPS every second
    if (deltaTime >= 1000) {
      fpsTracker.current.currentFPS = Math.round(
        (fpsTracker.current.frames * 1000) / deltaTime
      );
      fpsTracker.current.frames = 0;
      fpsTracker.current.lastTime = currentTime;
      updateMetrics();
    }

    requestAnimationFrame(trackFPSFrame);
  }, [opts.trackFPS, opts.enabled, updateMetrics]);

  // Start FPS tracking on mount
  useEffect(() => {
    if (opts.trackFPS && opts.enabled) {
      const rafId = requestAnimationFrame(trackFPSFrame);
      return () => cancelAnimationFrame(rafId);
    }
  }, [opts.trackFPS, opts.enabled, trackFPSFrame]);

  // Update metrics periodically (memory usage)
  useEffect(() => {
    if (!opts.enabled) return;

    const interval = setInterval(() => {
      updateMetrics();
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [opts.enabled, updateMetrics]);

  return {
    measureRender,
    measureLayout,
    measureConversion,
    getMetrics,
    logSlowOperation,
    resetMetrics,
    metrics,
    isEnabled: opts.enabled,
  };
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "42.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format milliseconds to human-readable string
 *
 * @param ms - Milliseconds
 * @returns Formatted string (e.g., "1.5s" or "250ms")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }

  return `${(ms / 1000).toFixed(2)}s`;
}
