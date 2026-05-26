import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import {
  Button,
  TreeView,
  type TreeViewHandle,
  type TreeViewProps,
} from '@pitchfork-ui/react';

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
    nodes: { control: 'object' },
    defaultExpandedValues: { control: 'object' },
  },
} satisfies Meta<typeof TreeView>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveWithControls(args: TreeViewProps) {
  const treeRef = useRef<TreeViewHandle>(null);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button size="sm" onClick={() => treeRef.current?.expandAll()}>
          Expand all
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => treeRef.current?.collapseAll()}
        >
          Collapse all
        </Button>
      </div>
      <TreeView ref={treeRef} {...args} />
    </div>
  );
}

export const Interactive: Story = {
  render: (args) => <InteractiveWithControls {...args} />,
};
