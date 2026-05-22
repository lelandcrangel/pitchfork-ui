import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContentDivider } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/ContentDivider',
  component: ContentDivider,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof ContentDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ContentDivider />,
};

export const WithLabel: Story = {
  render: () => <ContentDivider label="Billing" />,
};

export const Vertical: Story = {
  render: () => (
    <div
      style={{
        alignItems: 'stretch',
        display: 'flex',
        gap: 16,
        minHeight: 64,
      }}
    >
      <span>Left pane</span>
      <ContentDivider orientation="vertical" />
      <span>Right pane</span>
    </div>
  ),
};

export const Inset: Story = {
  render: () => <ContentDivider label="Continue" inset />,
};
