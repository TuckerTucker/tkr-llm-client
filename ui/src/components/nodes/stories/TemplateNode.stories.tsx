/**
 * Storybook Stories for TemplateNode
 *
 * Demonstrates all states and variations of the TemplateNode component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider } from 'reactflow';
import { TemplateNode } from '../TemplateNode';
import type { TemplateNodeData } from '../../../lib/types/ui-types';

const meta: Meta<typeof TemplateNode> = {
  title: 'Nodes/TemplateNode',
  component: TemplateNode,
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '400px', padding: '20px' }}>
          <Story />
        </div>
      </ReactFlowProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TemplateNode>;

// Mock data
const baseData: TemplateNodeData = {
  id: 'template-1',
  type: 'template',
  name: 'code-reviewer',
  description: 'Reviews code for quality and security',
  tags: ['security', 'code-analysis'],
  tools: ['Read', 'Grep', 'Write'],
  requiredVariables: ['targetFile', 'reviewType'],
  optionalVariables: ['maxIssues'],
  metadata: {},
  validationState: {
    valid: true,
    errors: [],
    warnings: [],
  },
  version: '1.0.0',
  cached: true,
};

// Default story
export const Default: Story = {
  args: {
    id: 'template-1',
    data: baseData,
    selected: false,
    zoomLevel: 1.0,
  },
};

// Selected state
export const Selected: Story = {
  args: {
    id: 'template-1',
    data: baseData,
    selected: true,
    zoomLevel: 1.0,
  },
};

// With validation error
export const WithError: Story = {
  args: {
    id: 'template-1',
    data: {
      ...baseData,
      validationState: {
        valid: false,
        errors: [
          {
            field: 'tools',
            message: 'Forbidden tool: WebSearch',
            severity: 'error',
          },
          {
            field: 'variables',
            message: 'Missing required variable: targetFile',
            severity: 'error',
          },
        ],
        warnings: [],
      },
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// With warning
export const WithWarning: Story = {
  args: {
    id: 'template-1',
    data: {
      ...baseData,
      validationState: {
        valid: true,
        errors: [],
        warnings: ['Consider adding more specific tool permissions'],
      },
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// Loading state
export const Loading: Story = {
  args: {
    id: 'template-1',
    data: {
      ...baseData,
      loading: true,
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// With inheritance (extends)
export const WithExtends: Story = {
  args: {
    id: 'template-1',
    data: {
      ...baseData,
      extends: 'base-agent',
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// With mixins
export const WithMixins: Story = {
  args: {
    id: 'template-1',
    data: {
      ...baseData,
      mixins: ['file-safety', 'error-handling'],
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// Minimal zoom level (<0.5)
export const ZoomMinimal: Story = {
  args: {
    id: 'template-1',
    data: baseData,
    selected: false,
    zoomLevel: 0.25,
  },
};

// Compact zoom level (0.5-1.0)
export const ZoomCompact: Story = {
  args: {
    id: 'template-1',
    data: baseData,
    selected: false,
    zoomLevel: 0.75,
  },
};

// Standard zoom level (1.0-1.5)
export const ZoomStandard: Story = {
  args: {
    id: 'template-1',
    data: baseData,
    selected: false,
    zoomLevel: 1.0,
  },
};

// Full zoom level (>1.5)
export const ZoomFull: Story = {
  args: {
    id: 'template-1',
    data: baseData,
    selected: false,
    zoomLevel: 2.0,
  },
};

// Complex template with all features
export const Complex: Story = {
  args: {
    id: 'template-1',
    data: {
      ...baseData,
      name: 'advanced-code-analyzer',
      description:
        'Advanced code analysis agent with security scanning, performance optimization suggestions, and automated refactoring capabilities',
      tags: ['security', 'performance', 'refactoring', 'code-analysis', 'best-practices'],
      tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash', 'WebSearch'],
      extends: 'base-analyzer',
      mixins: ['file-safety', 'error-handling', 'logging'],
      requiredVariables: ['targetFile', 'analysisType', 'severity'],
      optionalVariables: ['maxIssues', 'autoFix', 'reportFormat'],
      version: '2.1.3',
      cached: true,
    },
    selected: false,
    zoomLevel: 1.5,
  },
};
