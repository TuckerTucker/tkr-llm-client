/**
 * Performance Monitor Component
 *
 * Development-only component that displays real-time performance metrics.
 * Shows render times, layout calculations, memory usage, and FPS.
 *
 * @module components/debug/PerformanceMonitor
 * @version 1.0.0
 * @author Performance Optimization Engineer (Agent 2)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { usePerformance, formatBytes, formatDuration } from '../../hooks/usePerformance';
import { getAllCacheStats, logCacheStats } from '../../lib/utils/memoization';

/**
 * Performance monitor props
 */
export interface PerformanceMonitorProps {
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  /** Whether to show cache statistics */
  showCacheStats?: boolean;

  /** Whether to track FPS (can be expensive) */
  trackFPS?: boolean;

  /** Update interval in milliseconds */
  updateInterval?: number;
}

/**
 * Performance Monitor Component
 *
 * Displays real-time performance metrics in development mode.
 * Automatically hidden in production builds.
 *
 * Metrics shown:
 * - Average render time
 * - Last layout calculation time
 * - Last conversion time
 * - Memory usage (if available)
 * - FPS (if enabled)
 * - Render count
 * - Cache hit rates
 *
 * @param props - Component props
 * @returns Performance monitor overlay (null in production)
 *
 * @example
 * ```typescript
 * <PerformanceMonitor
 *   position="bottom-right"
 *   showCacheStats={true}
 *   trackFPS={true}
 * />
 * ```
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  position = 'bottom-right',
  showCacheStats = true,
  trackFPS = false,
  updateInterval = 1000,
}) => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { metrics, isEnabled, getMetrics } = usePerformance({
    enabled: true,
    trackFPS,
    trackMemory: true,
  });

  const [expanded, setExpanded] = useState(false);
  const [cacheStats, setCacheStats] = useState(getAllCacheStats());

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(getAllCacheStats());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  // Position styles
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 20, left: 20 },
    'top-right': { top: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
  };

  // Handle log cache stats
  const handleLogCacheStats = useCallback(() => {
    logCacheStats();
  }, []);

  // Get performance color based on value
  const getRenderColor = (ms: number): string => {
    if (ms < 16) return '#10b981'; // Green (60fps)
    if (ms < 33) return '#f59e0b'; // Yellow (30fps)
    return '#ef4444'; // Red (< 30fps)
  };

  const getFPSColor = (fps: number): string => {
    if (fps >= 55) return '#10b981'; // Green
    if (fps >= 30) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getMemoryColor = (mb: number): string => {
    if (mb < 50) return '#10b981'; // Green
    if (mb < 100) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        padding: expanded ? '12px' : '8px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: 9999,
        minWidth: expanded ? '280px' : 'auto',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Collapsed view - just FPS/Memory */}
      {!expanded && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', opacity: 0.7 }}>PERF</div>
          {trackFPS && (
            <div style={{ color: getFPSColor(metrics.fps), fontWeight: 600 }}>
              {metrics.fps} FPS
            </div>
          )}
          <div style={{ color: getMemoryColor(metrics.memoryUsage) }}>
            {formatBytes(metrics.memoryUsage * 1024 * 1024)}
          </div>
          <div style={{ fontSize: '10px', opacity: 0.5 }}>▼</div>
        </div>
      )}

      {/* Expanded view - all metrics */}
      {expanded && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '13px' }}>
              Performance Monitor
            </div>
            <div style={{ fontSize: '10px', opacity: 0.5 }}>▲</div>
          </div>

          {/* Render metrics */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ opacity: 0.7, fontSize: '10px', marginBottom: '4px' }}>
              RENDER
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: getRenderColor(metrics.renderTime),
              }}
            >
              <span>Avg. Time:</span>
              <span style={{ fontWeight: 600 }}>
                {formatDuration(metrics.renderTime)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Count:</span>
              <span>{metrics.renderCount}</span>
            </div>
          </div>

          {/* Layout metrics */}
          {metrics.layoutTime > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ opacity: 0.7, fontSize: '10px', marginBottom: '4px' }}>
                LAYOUT
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Calc:</span>
                <span style={{ fontWeight: 600 }}>
                  {formatDuration(metrics.layoutTime)}
                </span>
              </div>
            </div>
          )}

          {/* Conversion metrics */}
          {metrics.conversionTime > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ opacity: 0.7, fontSize: '10px', marginBottom: '4px' }}>
                CONVERSION
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Last Time:</span>
                <span style={{ fontWeight: 600 }}>
                  {formatDuration(metrics.conversionTime)}
                </span>
              </div>
            </div>
          )}

          {/* FPS */}
          {trackFPS && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ opacity: 0.7, fontSize: '10px', marginBottom: '4px' }}>
                FPS
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: getFPSColor(metrics.fps),
                }}
              >
                <span>Current:</span>
                <span style={{ fontWeight: 600 }}>{metrics.fps}</span>
              </div>
            </div>
          )}

          {/* Memory */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ opacity: 0.7, fontSize: '10px', marginBottom: '4px' }}>
              MEMORY
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: getMemoryColor(metrics.memoryUsage),
              }}
            >
              <span>JS Heap:</span>
              <span style={{ fontWeight: 600 }}>
                {formatBytes(metrics.memoryUsage * 1024 * 1024)}
              </span>
            </div>
          </div>

          {/* Cache stats */}
          {showCacheStats && (
            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ opacity: 0.7, fontSize: '10px', marginBottom: '6px' }}>
                CACHE
              </div>
              <div style={{ fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span style={{ opacity: 0.7 }}>Conversion:</span>
                  <span>
                    {cacheStats.conversion.hits}h / {cacheStats.conversion.misses}m
                    {' '}
                    <span style={{ opacity: 0.7 }}>
                      ({(cacheStats.conversion.hitRate * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7 }}>Layout:</span>
                  <span>
                    {cacheStats.layout.hits}h / {cacheStats.layout.misses}m
                    {' '}
                    <span style={{ opacity: 0.7 }}>
                      ({(cacheStats.layout.hitRate * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogCacheStats();
                }}
                style={{
                  marginTop: '6px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Log Stats to Console
              </button>
            </div>
          )}

          <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>
            Click to collapse
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Default export
 */
export default PerformanceMonitor;
