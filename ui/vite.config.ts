import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@backend': path.resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 3000,
    open: true,
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
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
});
