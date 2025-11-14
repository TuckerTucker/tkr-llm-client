import React, { useEffect, useState, lazy, Suspense } from 'react';
import type { Node, Edge } from 'reactflow';
import { Canvas } from './components/canvas/Canvas';
import { LoadingOverlay } from './components/LoadingOverlay';
import { RootErrorBoundary } from './components/errors/RootErrorBoundary';
import { CanvasErrorBoundary } from './components/errors/CanvasErrorBoundary';
import { ToastContainer } from './components/notifications/ToastContainer';
import { ModeSelector } from './components/modes/ModeSelector';
import { ExportModal } from './components/export/ExportModal';
import { LayoutSelector } from './components/canvas/LayoutSelector';
import type { AgentTemplate } from '@/../../src/templates/types';
import { convertTemplateToReactFlow } from './lib/converters/templateToReactFlow';
import { useAutoLayout } from './hooks/useAutoLayout';
import { useModes } from './hooks/useModes';
import { useVariableStore } from '@/../../src/lib/variables/variable-store';
import type { VariableDefinition } from '@/../../src/lib/variables/types';
import { VariableType } from '@/../../src/lib/variables/types';
import { toast } from './lib/notifications/toast';
import { logError } from './lib/errors/logging';
import { classifyError } from './lib/errors/classification';

// Lazy load heavy components
const UndoRedoControls = lazy(() => import('@/../../src/components/canvas/UndoRedoControls').then(m => ({ default: m.UndoRedoControls })));
const TemplateCatalog = lazy(() => import('@/../../src/components/catalog/TemplateCatalog').then(m => ({ default: m.TemplateCatalog })));
const VariablePanel = lazy(() => import('./components/variables/VariablePanel').then(m => ({ default: m.VariablePanel })));

// Helper to create demo variables for each template
function createDemoVariables(templateName: string): VariableDefinition[] {
  switch (templateName) {
    case 'code-reviewer':
      return [
        {
          name: 'codePath',
          label: 'Code Path',
          type: VariableType.FILE_PATH,
          description: 'Path to the code file or directory to review',
          required: true,
          placeholder: '/path/to/code',
        },
        {
          name: 'maxFileSize',
          label: 'Max File Size (MB)',
          type: VariableType.NUMBER,
          description: 'Maximum file size to review in megabytes',
          required: true,
          defaultValue: 10,
        },
        {
          name: 'includeTests',
          label: 'Include Tests',
          type: VariableType.BOOLEAN,
          description: 'Whether to include test files in the review',
          required: false,
          defaultValue: false,
        },
        {
          name: 'excludePatterns',
          label: 'Exclude Patterns',
          type: VariableType.ARRAY,
          description: 'File patterns to exclude from review',
          required: false,
          placeholder: 'node_modules/\ndist/',
        },
      ];

    case 'doc-generator':
      return [
        {
          name: 'targetPath',
          label: 'Target Path',
          type: VariableType.DIRECTORY_PATH,
          description: 'Directory containing code to document',
          required: true,
        },
        {
          name: 'outputFormat',
          label: 'Output Format',
          type: VariableType.STRING,
          description: 'Documentation format (markdown, html, etc.)',
          required: true,
          defaultValue: 'markdown',
        },
        {
          name: 'includePrivate',
          label: 'Include Private Members',
          type: VariableType.BOOLEAN,
          description: 'Include private/internal APIs in documentation',
          required: false,
          defaultValue: false,
        },
      ];

    case 'test-writer':
      return [
        {
          name: 'sourceFile',
          label: 'Source File',
          type: VariableType.FILE_PATH,
          description: 'Source file to write tests for',
          required: true,
        },
        {
          name: 'testFramework',
          label: 'Test Framework',
          type: VariableType.STRING,
          description: 'Test framework to use (jest, vitest, mocha, etc.)',
          required: true,
          defaultValue: 'vitest',
        },
        {
          name: 'coverageThreshold',
          label: 'Coverage Threshold (%)',
          type: VariableType.NUMBER,
          description: 'Target code coverage percentage',
          required: false,
          defaultValue: 80,
        },
      ];

    default:
      return [];
  }
}

// Demo templates
const demoTemplates: AgentTemplate[] = [
  {
    metadata: {
      name: 'code-reviewer',
      description: 'Reviews code for quality, bugs, and best practices',
      version: '1.0.0',
      tags: ['code', 'review', 'quality'],
    },
    agent: {
      description: 'Code review agent',
      prompt: 'You are a code reviewer. Analyze the provided code for bugs, security issues, and best practices.',
      tools: ['Read', 'Grep'],
    },
  },
  {
    metadata: {
      name: 'doc-generator',
      description: 'Generates documentation from code',
      version: '1.0.0',
      tags: ['documentation', 'code'],
    },
    agent: {
      description: 'Documentation generator',
      prompt: 'You are a documentation generator. Create comprehensive documentation for the provided code.',
      tools: ['Read', 'Write'],
    },
  },
  {
    metadata: {
      name: 'test-writer',
      description: 'Writes unit tests for code',
      version: '1.0.0',
      tags: ['testing', 'code'],
    },
    agent: {
      description: 'Test writing agent',
      prompt: 'You are a test writer. Create comprehensive unit tests for the provided code.',
      tools: ['Read', 'Write'],
    },
  },
];

function App() {
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [showCatalog, setShowCatalog] = useState(true);
  const [showVariables, setShowVariables] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Variable store actions
  const setTemplate = useVariableStore((state) => state.setTemplate);

  // Load layout preference from localStorage
  const getInitialLayout = () => {
    try {
      const stored = localStorage.getItem('reactflow-layout-algorithm');
      if (stored && ['dagre', 'grid', 'force', 'circular', 'tree', 'elk', 'manual'].includes(stored)) {
        return stored as any;
      }
    } catch (error) {
      console.warn('Failed to load layout preference:', error);
    }
    return 'dagre';
  };

  const [layoutAlgorithm, setLayoutAlgorithm] = useState(getInitialLayout());

  // Use layout hook from Agent 2
  const { layoutedNodes, layoutedEdges, applyLayout, currentAlgorithm } = useAutoLayout(
    nodes,
    edges,
    { algorithm: layoutAlgorithm, animated: true }
  );

  // Handle layout change with localStorage persistence
  const handleLayoutChange = (algorithm: any) => {
    setLayoutAlgorithm(algorithm);
    applyLayout(algorithm);

    // Save to localStorage
    try {
      localStorage.setItem('reactflow-layout-algorithm', algorithm);
    } catch (error) {
      console.warn('Failed to save layout preference:', error);
    }
  };

  // Use modes hook from Agent 1 (Wave 2)
  const {
    currentMode,
    setMode,
    filteredNodes,
    filteredEdges,
    filterStats,
    modeConfig,
  } = useModes(layoutedNodes, layoutedEdges);

  useEffect(() => {
    document.title = 'ReactFlow Template UI';
  }, []);

  // Keyboard shortcuts: V for variables, E for export
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input is focused
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // V key to toggle variables panel
      if (e.key === 'v' || e.key === 'V') {
        if (selectedTemplate) {
          setShowVariables((prev) => !prev);
        }
      }

      // Cmd/Ctrl + E to open export modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (selectedTemplate) {
          setShowExportModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTemplate]);

  // Handle template selection - convert and layout
  useEffect(() => {
    if (selectedTemplate) {
      setIsLoading(true);
      setError(null);

      try {
        // Agent 1's converter
        const result = convertTemplateToReactFlow(selectedTemplate);

        if (result.metadata.hasErrors) {
          const errorMsg = result.metadata.errors?.map(e => e.message).join(', ') || 'Conversion failed';
          setError(errorMsg);
          setNodes([]);
          setEdges([]);

          // Show error toast with details
          const firstError = result.metadata.errors?.[0];
          if (firstError) {
            const err = new Error(firstError.message);
            const classified = classifyError(err, {
              template: selectedTemplate.metadata.name,
              recoverable: firstError.recoverable
            });
            toast.error(classified.userMessage, {
              duration: 5000,
              action: firstError.recoverable ? {
                label: 'Retry',
                onClick: handleRetry
              } : undefined
            });
            logError('TemplateConverter', err, undefined, { result: result.metadata });
          }
        } else {
          setNodes(result.nodes);
          setEdges(result.edges);
          setError(null);

          // Initialize demo variables for this template
          const demoVariables = createDemoVariables(selectedTemplate.metadata.name);
          setTemplate(selectedTemplate.metadata.name, demoVariables);

          // Show success toast
          toast.success(`Template "${selectedTemplate.metadata.name}" loaded successfully`);
        }
      } catch (err: any) {
        const error = err as Error;
        setError(error.message || 'Unknown error during conversion');
        setNodes([]);
        setEdges([]);

        // Classify and log error
        const classified = classifyError(error, { template: selectedTemplate.metadata.name });
        logError('TemplateConverter', error, undefined, { template: selectedTemplate.metadata.name });

        // Show error toast
        toast.error(classified.userMessage, {
          duration: 5000,
          action: classified.recoverable ? {
            label: classified.suggestedAction || 'Retry',
            onClick: handleRetry
          } : undefined
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Clear canvas when no template selected
      setNodes([]);
      setEdges([]);
      setError(null);
      setShowVariables(false);
    }
  }, [selectedTemplate, setTemplate]);

  // Node/Edge change handlers for ReactFlow
  const handleNodesChange = (changes: any) => {
    // ReactFlow change handlers - integrated with canvas store via Canvas component
    // Changes are logged only in development mode
    if (process.env.NODE_ENV === 'development') {
      console.debug('Nodes changed:', changes);
    }
  };

  const handleEdgesChange = (changes: any) => {
    // ReactFlow change handlers - integrated with canvas store via Canvas component
    // Changes are logged only in development mode
    if (process.env.NODE_ENV === 'development') {
      console.debug('Edges changed:', changes);
    }
  };

  const handleRetry = () => {
    if (selectedTemplate) {
      // Trigger re-conversion by setting to null and back
      const temp = selectedTemplate;
      setSelectedTemplate(null);
      setTimeout(() => setSelectedTemplate(temp), 10);
    }
  };

  return (
    <RootErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        {/* Catalog Sidebar */}
        {showCatalog && (
          <div
            style={{
              width: '350px',
              height: '100%',
              borderRight: '1px solid #e5e7eb',
              backgroundColor: 'white',
              overflow: 'hidden',
            }}
          >
            <Suspense fallback={<div style={{ padding: '20px' }}>Loading catalog...</div>}>
              <TemplateCatalog
                templates={demoTemplates}
                selectedId={selectedTemplate?.metadata.name}
                onSelect={setSelectedTemplate}
                showPreview
              />
            </Suspense>
          </div>
        )}

        {/* Main Canvas Area */}
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          {/* Header */}
          <div
            style={{
              minHeight: '110px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: 'white',
              padding: '20px',
            }}
          >
            {/* Top Row: Title and Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
                ReactFlow Template UI
              </h1>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0 0' }}>
                Visual Agent Template Editor
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setShowCatalog(!showCatalog)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {showCatalog ? 'Hide' : 'Show'} Catalog
              </button>
              {selectedTemplate && (
                <>
                  <button
                    onClick={() => setShowVariables(!showVariables)}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: showVariables ? '#eff6ff' : 'white',
                      color: showVariables ? '#1d4ed8' : '#374151',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: showVariables ? 500 : 400,
                    }}
                    title="Toggle variables panel (V)"
                  >
                    {showVariables ? 'Hide' : 'Show'} Variables
                  </button>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <strong>Selected:</strong> {selectedTemplate.metadata.name}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Row: Mode Selector, Layout Selector, and Stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <ModeSelector
                currentMode={currentMode}
                onModeChange={setMode}
                showDescriptions={true}
                showShortcuts={true}
              />
              {selectedTemplate && (
                <LayoutSelector
                  currentLayout={currentAlgorithm}
                  onLayoutChange={handleLayoutChange}
                  showPreview={true}
                />
              )}
            </div>

            {/* Filter Stats */}
            {selectedTemplate && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <div>
                  <strong>{filterStats.visibleNodes}</strong> / {filterStats.totalNodes} nodes
                </div>
                <div>
                  <strong>{filterStats.visibleEdges}</strong> / {filterStats.totalEdges} edges
                </div>
                <div
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    fontWeight: 500,
                  }}
                >
                  {modeConfig.name} Mode
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div style={{ height: 'calc(100% - 110px)', position: 'relative' }}>
          <CanvasErrorBoundary>
            <Canvas
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onExport={() => setShowExportModal(true)}
            />

            {/* Undo/Redo Controls */}
            <Suspense fallback={null}>
              <UndoRedoControls position="bottom-right" showShortcuts />
            </Suspense>

            {/* Loading Overlay */}
            <LoadingOverlay
              isLoading={isLoading}
              error={error}
              onRetry={handleRetry}
              message="Converting template..."
            />

            {/* Welcome Message */}
            {!selectedTemplate && !isLoading && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎨</div>
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Welcome to ReactFlow Template UI
                </h2>
                <p style={{ fontSize: '16px', color: '#6b7280' }}>
                  Select a template from the catalog to get started
                </p>
              </div>
            )}
          </CanvasErrorBoundary>
        </div>
        </div>

        {/* Variable Panel (Right Sidebar) */}
        {showVariables && selectedTemplate && (
          <Suspense fallback={<div style={{ width: '400px', padding: '20px' }}>Loading variables...</div>}>
            <VariablePanel
              templateId={selectedTemplate.metadata.name}
              templateName={selectedTemplate.metadata.name}
              onClose={() => setShowVariables(false)}
            />
          </Suspense>
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          template={selectedTemplate}
          nodes={filteredNodes}
          edges={filteredEdges}
          mode="template"
        />

        {/* Toast Container */}
        <ToastContainer position="top-right" maxToasts={5} />
      </div>
    </RootErrorBoundary>
  );
}

export default App;
