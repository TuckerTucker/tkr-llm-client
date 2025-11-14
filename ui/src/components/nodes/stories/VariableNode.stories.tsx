/**
 * Storybook Stories for VariableNode
 *
 * Demonstrates all states and variations of the VariableNode component.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider } from 'reactflow';
import { VariableNode } from '../VariableNode';
import type { VariableNodeData } from '../../../lib/types/ui-types';

const meta: Meta<typeof VariableNode> = {
  title: 'Nodes/VariableNode',
  component: VariableNode,
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '300px', padding: '20px' }}>
          <Story />
        </div>
      </ReactFlowProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VariableNode>;

// String variable
export const StringVariable: Story = {
  args: {
    id: 'var-1',
    data: {
      id: 'var-1',
      type: 'variable',
      name: 'targetFile',
      variableName: 'targetFile',
      value: 'src/index.ts',
      variableType: 'string',
      required: true,
      metadata: {},
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// Number variable
export const NumberVariable: Story = {
  args: {
    id: 'var-2',
    data: {
      id: 'var-2',
      type: 'variable',
      name: 'maxIssues',
      variableName: 'maxIssues',
      value: 10,
      variableType: 'number',
      required: false,
      defaultValue: 5,
      metadata: {},
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// Boolean variable
export const BooleanVariable: Story = {
  args: {
    id: 'var-3',
    data: {
      id: 'var-3',
      type: 'variable',
      name: 'autoFix',
      variableName: 'autoFix',
      value: true,
      variableType: 'boolean',
      required: false,
      defaultValue: false,
      metadata: {},
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// Enum variable
export const EnumVariable: Story = {
  args: {
    id: 'var-4',
    data: {
      id: 'var-4',
      type: 'variable',
      name: 'severity',
      variableName: 'severity',
      value: 'high',
      variableType: 'enum',
      required: true,
      enumOptions: ['low', 'medium', 'high', 'critical'],
      metadata: {},
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// Required and empty (invalid)
export const RequiredEmpty: Story = {
  args: {
    id: 'var-5',
    data: {
      id: 'var-5',
      type: 'variable',
      name: 'requiredVar',
      variableName: 'requiredVar',
      value: '',
      variableType: 'string',
      required: true,
      metadata: {},
    },
    selected: false,
    zoomLevel: 1.0,
  },
};

// Selected
export const Selected: Story = {
  args: {
    id: 'var-6',
    data: {
      id: 'var-6',
      type: 'variable',
      name: 'targetFile',
      variableName: 'targetFile',
      value: 'src/index.ts',
      variableType: 'string',
      required: true,
      metadata: {},
    },
    selected: true,
    zoomLevel: 1.0,
  },
};

// Zoom levels
export const ZoomMinimal: Story = {
  args: {
    id: 'var-7',
    data: {
      id: 'var-7',
      type: 'variable',
      name: 'targetFile',
      variableName: 'targetFile',
      value: 'src/index.ts',
      variableType: 'string',
      required: true,
      metadata: {},
    },
    selected: false,
    zoomLevel: 0.25,
  },
};

export const ZoomCompact: Story = {
  args: {
    id: 'var-8',
    data: {
      id: 'var-8',
      type: 'variable',
      name: 'targetFile',
      variableName: 'targetFile',
      value: 'src/index.ts',
      variableType: 'string',
      required: true,
      metadata: {},
    },
    selected: false,
    zoomLevel: 0.75,
  },
};

export const ZoomFull: Story = {
  args: {
    id: 'var-9',
    data: {
      id: 'var-9',
      type: 'variable',
      name: 'targetFile',
      variableName: 'targetFile',
      value: 'src/index.ts',
      variableType: 'string',
      required: true,
      metadata: {},
    },
    selected: false,
    zoomLevel: 2.0,
  },
};
