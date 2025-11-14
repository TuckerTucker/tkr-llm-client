/**
 * ZoomAdaptive HOC
 *
 * Higher-Order Component for making nodes zoom-aware.
 * Automatically injects zoom level and detail level into node components,
 * enabling semantic zoom behavior.
 *
 * @module components/nodes/enhancements/ZoomAdaptive
 * @version 1.0.0
 * @author Visual Enhancement Engineer (Agent 3, Wave 2)
 */

import React from 'react';
import { useZoomLevel } from '../../../hooks/useZoomLevel';
import type { BaseNodeProps, NodeData } from '../../../lib/types/ui-types';
import type { DetailLevel } from '../styles';

/**
 * Props injected by the ZoomAdaptive HOC
 */
export interface ZoomAwareProps {
  /** Current zoom level (1.0 = 100%) */
  zoom: number;

  /** Calculated detail level based on zoom */
  detailLevel: DetailLevel;

  /** Whether currently at minimal detail level */
  isMinimal: boolean;

  /** Whether currently at compact detail level */
  isCompact: boolean;

  /** Whether currently at standard detail level */
  isStandard: boolean;

  /** Whether currently at full detail level */
  isFull: boolean;
}

/**
 * Make a node component zoom-aware
 *
 * Wraps a node component and injects zoom-related props automatically.
 * The wrapped component receives all zoom information and can adapt its
 * rendering based on the current zoom level.
 *
 * @param Component - Node component to wrap
 * @returns Zoom-aware version of the component
 *
 * @example
 * ```tsx
 * // Original component
 * function MyNode({ id, data, detailLevel }: BaseNodeProps & ZoomAwareProps) {
 *   return (
 *     <div>
 *       {detailLevel === 'full' && <DetailedView />}
 *       {detailLevel === 'minimal' && <MinimalView />}
 *     </div>
 *   );
 * }
 *
 * // Make it zoom-aware
 * export default withZoomAdaptive(MyNode);
 *
 * // Or as decorator
 * @withZoomAdaptive
 * class MyNode extends React.Component { ... }
 * ```
 */
export function withZoomAdaptive<P extends BaseNodeProps<NodeData>>(
  Component: React.ComponentType<P & ZoomAwareProps>
): React.FC<P> {
  const ZoomAdaptiveComponent: React.FC<P> = (props) => {
    const zoomState = useZoomLevel();

    const enhancedProps = {
      ...props,
      zoom: zoomState.zoom,
      detailLevel: zoomState.detailLevel,
      isMinimal: zoomState.isMinimal,
      isCompact: zoomState.isCompact,
      isStandard: zoomState.isStandard,
      isFull: zoomState.isFull,
    } as P & ZoomAwareProps;

    return <Component {...enhancedProps} />;
  };

  // Preserve component name for debugging
  ZoomAdaptiveComponent.displayName = `ZoomAdaptive(${
    Component.displayName || Component.name || 'Component'
  })`;

  return ZoomAdaptiveComponent;
}

/**
 * Zoom-Adaptive Wrapper Component
 *
 * Alternative to HOC pattern - wraps children with zoom context.
 * Useful when you want to make an existing component zoom-aware
 * without modifying its definition.
 *
 * @example
 * ```tsx
 * function MyNode(props: BaseNodeProps) {
 *   return (
 *     <ZoomAdaptive>
 *       {({ detailLevel, zoom }) => (
 *         <div>
 *           Zoom: {zoom}
 *           {detailLevel === 'full' && <Details />}
 *         </div>
 *       )}
 *     </ZoomAdaptive>
 *   );
 * }
 * ```
 */
export interface ZoomAdaptiveProps {
  /** Render function that receives zoom state */
  children: (zoomState: ZoomAwareProps) => React.ReactNode;

  /** Additional CSS classes */
  className?: string;
}

export const ZoomAdaptive: React.FC<ZoomAdaptiveProps> = ({
  children,
  className = '',
}) => {
  const zoomState = useZoomLevel();

  const zoomAwareProps: ZoomAwareProps = {
    zoom: zoomState.zoom,
    detailLevel: zoomState.detailLevel,
    isMinimal: zoomState.isMinimal,
    isCompact: zoomState.isCompact,
    isStandard: zoomState.isStandard,
    isFull: zoomState.isFull,
  };

  return <div className={className}>{children(zoomAwareProps)}</div>;
};

/**
 * Hook-based alternative for functional components
 *
 * Use this when you want to access zoom state directly in a component
 * without using HOC or wrapper patterns.
 *
 * @example
 * ```tsx
 * function MyNode(props: BaseNodeProps) {
 *   const { detailLevel, zoom } = useZoomAware();
 *
 *   if (detailLevel === 'minimal') {
 *     return <MinimalView />;
 *   }
 *
 *   return <FullView />;
 * }
 * ```
 */
export function useZoomAware(): ZoomAwareProps {
  const zoomState = useZoomLevel();

  return {
    zoom: zoomState.zoom,
    detailLevel: zoomState.detailLevel,
    isMinimal: zoomState.isMinimal,
    isCompact: zoomState.isCompact,
    isStandard: zoomState.isStandard,
    isFull: zoomState.isFull,
  };
}

/**
 * Conditional rendering helpers for different detail levels
 */
export const DetailLevelRenderers = {
  /**
   * Render content only at minimal detail level
   */
  Minimal: ({ children }: { children: React.ReactNode }) => {
    const { isMinimal } = useZoomAware();
    return isMinimal ? <>{children}</> : null;
  },

  /**
   * Render content only at compact detail level
   */
  Compact: ({ children }: { children: React.ReactNode }) => {
    const { isCompact } = useZoomAware();
    return isCompact ? <>{children}</> : null;
  },

  /**
   * Render content only at standard detail level
   */
  Standard: ({ children }: { children: React.ReactNode }) => {
    const { isStandard } = useZoomAware();
    return isStandard ? <>{children}</> : null;
  },

  /**
   * Render content only at full detail level
   */
  Full: ({ children }: { children: React.ReactNode }) => {
    const { isFull } = useZoomAware();
    return isFull ? <>{children}</> : null;
  },

  /**
   * Render content at standard or higher detail levels
   */
  StandardOrHigher: ({ children }: { children: React.ReactNode }) => {
    const { detailLevel } = useZoomAware();
    return detailLevel === 'standard' || detailLevel === 'full' ? (
      <>{children}</>
    ) : null;
  },

  /**
   * Render content at compact or higher detail levels
   */
  CompactOrHigher: ({ children }: { children: React.ReactNode }) => {
    const { detailLevel } = useZoomAware();
    return detailLevel !== 'minimal' ? <>{children}</> : null;
  },
};

/**
 * Example usage component showing all patterns
 */
export const ZoomAdaptiveExample: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      {/* Pattern 1: Render prop */}
      <ZoomAdaptive>
        {({ detailLevel, zoom }) => (
          <div>
            <div>Current zoom: {zoom.toFixed(2)}</div>
            <div>Detail level: {detailLevel}</div>
          </div>
        )}
      </ZoomAdaptive>

      {/* Pattern 2: Conditional renderers */}
      <div>
        <DetailLevelRenderers.Minimal>
          <div>Minimal view</div>
        </DetailLevelRenderers.Minimal>

        <DetailLevelRenderers.CompactOrHigher>
          <div>Compact or higher view</div>
        </DetailLevelRenderers.CompactOrHigher>

        <DetailLevelRenderers.Full>
          <div>Full detail view</div>
        </DetailLevelRenderers.Full>
      </div>

      {/* Pattern 3: Direct hook usage */}
      <DirectHookExample />
    </div>
  );
};

function DirectHookExample() {
  const { detailLevel, zoomPercentage } = useZoomAware();

  return (
    <div>
      <div>Zoom: {zoomPercentage}%</div>
      <div>Level: {detailLevel}</div>
    </div>
  );
}

export default withZoomAdaptive;
