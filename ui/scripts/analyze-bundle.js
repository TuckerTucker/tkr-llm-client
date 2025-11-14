#!/usr/bin/env node
/**
 * Bundle Analysis Script
 *
 * Analyzes the production bundle and generates a visual report showing:
 * - Bundle size breakdown by module
 * - Chunk sizes and dependencies
 * - Gzipped sizes
 * - Treemap visualization
 *
 * Usage: npm run analyze
 *
 * @module scripts/analyze-bundle
 * @version 1.0.0
 * @author Performance Optimization Engineer (Agent 2)
 */

import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run bundle analysis
 */
async function analyze() {
  console.log('🔍 Analyzing bundle...\n');

  try {
    await build({
      root: path.resolve(__dirname, '..'),
      plugins: [
        react(),
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // 'treemap' | 'sunburst' | 'network'
          title: 'Bundle Analysis - ReactFlow Template UI',
          sourcemap: true,
        }),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@components': path.resolve(__dirname, '../src/components'),
          '@lib': path.resolve(__dirname, '../src/lib'),
          '@backend': path.resolve(__dirname, '../../src'),
        },
      },
      build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
          output: {
            // Manual chunks for better code splitting
            manualChunks: {
              // React vendor bundle
              'react-vendor': ['react', 'react-dom'],

              // ReactFlow vendor bundle (largest dependency)
              'reactflow-vendor': ['reactflow'],

              // Layout engines bundle
              'layout-engines': ['dagre', '@dagrejs/dagre', 'elkjs', 'd3-force'],

              // Zustand state management
              'state-vendor': ['zustand'],

              // UI components
              'ui-nodes': [
                './src/components/nodes/BaseNode',
                './src/components/nodes/TemplateNode',
                './src/components/nodes/FragmentNode',
                './src/components/nodes/VariableNode',
                './src/components/nodes/ToolConfigNode',
                './src/components/nodes/BundleNode',
                './src/components/nodes/ResolvedNode',
              ],
              'ui-canvas': [
                './src/components/canvas/Canvas',
                './src/components/canvas/Controls',
                './src/components/canvas/NodeDetails',
                './src/components/canvas/LayoutSelector',
              ],
              'ui-variables': [
                './src/components/variables/VariablePanel',
                './src/components/variables/VariableInput',
              ],
            },
          },
        },
        chunkSizeWarningLimit: 600,
      },
    });

    console.log('\n✅ Bundle analysis complete!');
    console.log('📊 Opening visualization in browser...');
    console.log('\nReport saved to: dist/stats.html');
    console.log('\nKey metrics to check:');
    console.log('  • Total bundle size');
    console.log('  • Largest chunks and their contents');
    console.log('  • Gzipped vs uncompressed sizes');
    console.log('  • Duplicate dependencies');
    console.log('  • Optimization opportunities\n');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  }
}

// Run analysis
analyze();
