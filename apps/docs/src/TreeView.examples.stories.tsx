import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import {
  Badge,
  Button,
  TreeView,
  type TreeViewHandle,
  type TreeViewProps,
} from '@pitchfork-ui/react';

const baseNodes = [
  {
    value: 'root',
    label: 'Product',
    children: [
      {
        value: 'docs',
        label: 'Docs',
        badge: <Badge>3</Badge>,
        children: [
          { value: 'guides', label: 'Guides' },
          { value: 'api', label: 'API reference' },
          { value: 'release', label: 'Release notes' },
        ],
      },
      {
        value: 'apps',
        label: 'Apps',
        children: [
          { value: 'ios', label: 'iOS' },
          { value: 'android', label: 'Android' },
          { value: 'web', label: 'Web' },
        ],
      },
      {
        value: 'archive',
        label: 'Archive',
        disabled: true,
      },
    ],
  },
];

const meta = {
  title: 'Examples/Tree View',
  component: TreeView,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    nodes: baseNodes,
  },
} satisfies Meta<typeof TreeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultExpandedValues: ['root', 'docs'],
    defaultSelectedValue: 'api',
  },
};

export const WithBadges: Story = {
  args: {
    defaultExpandedValues: ['root'],
    defaultSelectedValue: 'docs',
  },
};

export const CompactRoot: Story = {
  args: {
    nodes: [
      {
        value: 'project',
        label: 'Project files',
        children: [
          { value: 'readme', label: 'README.md' },
          { value: 'changelog', label: 'CHANGELOG.md' },
          { value: 'contrib', label: 'CONTRIBUTING.md' },
        ],
      },
    ],
    defaultExpandedValues: ['project'],
    defaultSelectedValue: 'readme',
  },
};

export const DeepHierarchy: Story = {
  args: {
    nodes: [
      {
        value: 'program',
        label: 'Program',
        children: [
          {
            value: 'phase-1',
            label: 'Phase 1',
            children: [
              {
                value: 'phase-1-workstream-a',
                label: 'Workstream A',
                children: [
                  {
                    value: 'phase-1-epic-platform',
                    label: 'Epic: Platform',
                    children: [
                      {
                        value: 'phase-1-feature-observability',
                        label: 'Feature: Observability',
                        children: [
                          {
                            value: 'phase-1-task-tracing',
                            label: 'Task: Add distributed tracing',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                value: 'phase-1-workstream-b',
                label: 'Workstream B',
                children: [
                  {
                    value: 'phase-1-epic-growth',
                    label: 'Epic: Growth',
                    children: [
                      {
                        value: 'phase-1-feature-segments',
                        label: 'Feature: Segment builder',
                        children: [
                          {
                            value: 'phase-1-task-rollout',
                            label: 'Task: Launch cohort rollout',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            value: 'phase-2',
            label: 'Phase 2',
            children: [
              {
                value: 'phase-2-workstream-a',
                label: 'Workstream A',
                children: [
                  {
                    value: 'phase-2-epic-security',
                    label: 'Epic: Security',
                    children: [
                      {
                        value: 'phase-2-feature-secrets',
                        label: 'Feature: Secrets rotation',
                        children: [
                          {
                            value: 'phase-2-task-kms',
                            label: 'Task: Integrate KMS provider',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                value: 'phase-2-workstream-b',
                label: 'Workstream B',
                children: [
                  {
                    value: 'phase-2-epic-reliability',
                    label: 'Epic: Reliability',
                    children: [
                      {
                        value: 'phase-2-feature-failover',
                        label: 'Feature: Region failover',
                        children: [
                          {
                            value: 'phase-2-task-drills',
                            label: 'Task: Run disaster drills',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            value: 'phase-3',
            label: 'Phase 3',
            children: [
              {
                value: 'phase-3-workstream-a',
                label: 'Workstream A',
                children: [
                  {
                    value: 'phase-3-epic-experience',
                    label: 'Epic: Experience',
                    children: [
                      {
                        value: 'phase-3-feature-personalization',
                        label: 'Feature: Personalization',
                        children: [
                          {
                            value: 'phase-3-task-recommendations',
                            label: 'Task: Add recommendations rail',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                value: 'phase-3-workstream-b',
                label: 'Workstream B',
                children: [
                  {
                    value: 'phase-3-epic-operations',
                    label: 'Epic: Operations',
                    children: [
                      {
                        value: 'phase-3-feature-automation',
                        label: 'Feature: Workflow automation',
                        children: [
                          {
                            value: 'phase-3-task-runbooks',
                            label: 'Task: Generate runbooks from playbooks',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    defaultExpandedValues: [
      'program',
      'phase-1',
      'phase-1-workstream-a',
      'phase-1-epic-platform',
      'phase-1-feature-observability',
      'phase-1-workstream-b',
      'phase-1-epic-growth',
      'phase-1-feature-segments',
      'phase-2',
      'phase-2-workstream-a',
      'phase-2-epic-security',
      'phase-2-feature-secrets',
      'phase-2-workstream-b',
      'phase-2-epic-reliability',
      'phase-2-feature-failover',
      'phase-3',
      'phase-3-workstream-a',
      'phase-3-epic-experience',
      'phase-3-feature-personalization',
      'phase-3-workstream-b',
      'phase-3-epic-operations',
      'phase-3-feature-automation',
    ],
    defaultSelectedValue: 'phase-2-task-drills',
  },
};

const expandCollapseWrapStyle: React.CSSProperties = { display: 'grid', gap: 12 };
const expandCollapseButtonRowStyle: React.CSSProperties = { display: 'flex', gap: 8 };

function ExpandCollapseAllDemo(args: TreeViewProps) {
  const treeRef = useRef<TreeViewHandle>(null);

  return (
    <div style={expandCollapseWrapStyle}>
      <div style={expandCollapseButtonRowStyle}>
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

export const ExpandCollapseAll: Story = {
  render: (args) => <ExpandCollapseAllDemo {...args} />,
  args: {
    defaultExpandedValues: ['root'],
    defaultSelectedValue: 'docs',
  },
  parameters: {
    docs: {
      source: {
        code: `function ExpandCollapseAllExample() {
  const treeRef = useRef(null);

  return (
    <>
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
      <TreeView
        ref={treeRef}
        nodes={nodes}
        defaultExpandedValues={['root']}
        defaultSelectedValue="docs"
      />
    </>
  );
}`,
      },
    },
  },
};
