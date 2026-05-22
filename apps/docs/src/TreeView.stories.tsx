import type { Meta, StoryObj } from '@storybook/react-vite';
import { TreeView } from '@pitchfork-ui/react';

const nodes = [
  {
    value: 'workspace',
    label: 'Workspace',
    children: [
      {
        value: 'design',
        label: 'Design',
        children: [
          { value: 'mocks', label: 'Mocks.fig' },
          { value: 'assets', label: 'Assets' },
        ],
      },
      {
        value: 'engineering',
        label: 'Engineering',
        children: [
          { value: 'frontend', label: 'Frontend' },
          { value: 'backend', label: 'Backend' },
        ],
      },
      {
        value: 'operations',
        label: 'Operations',
        disabled: true,
      },
    ],
  },
];

const meta = {
  title: 'Components/Tree Views',
  component: TreeView,
  tags: ['ai-generated', 'test'],
  args: {
    nodes,
    defaultExpandedValues: ['workspace', 'design'],
    defaultSelectedValue: 'assets',
  },
  argTypes: {
    nodes: { control: false },
  },
} satisfies Meta<typeof TreeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
