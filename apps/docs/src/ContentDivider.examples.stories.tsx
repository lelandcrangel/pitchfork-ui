import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContentDivider } from '@pitchfork-ui/react';

const verticalDemoStyle: React.CSSProperties = {
  alignItems: 'stretch',
  display: 'flex',
  gap: 16,
  minHeight: 64,
};

const meta = {
  title: 'Examples/ContentDivider',
  component: ContentDivider,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof ContentDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ContentDivider />,
  parameters: {
    docs: {
      source: {
        code: `<ContentDivider />`,
      },
    },
  },
};

export const WithLabel: Story = {
  render: () => <ContentDivider label="Billing" />,
  parameters: {
    docs: {
      source: {
        code: `<ContentDivider label="Billing" />`,
      },
    },
  },
};

export const Vertical: Story = {
  render: () => (
    <div style={verticalDemoStyle}>
      <span>Left pane</span>
      <ContentDivider orientation="vertical" />
      <span>Right pane</span>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ContentDivider orientation="vertical" />`,
      },
    },
  },
};

export const Inset: Story = {
  render: () => <ContentDivider label="Continue" inset />,
  parameters: {
    docs: {
      source: {
        code: `<ContentDivider label="Continue" inset />`,
      },
    },
  },
};
