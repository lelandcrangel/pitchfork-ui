import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContentDivider } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/ContentDivider',
  component: ContentDivider,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Section title',
    orientation: 'horizontal',
    inset: false,
  },
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    inset: { control: 'boolean' },
  },
} satisfies Meta<typeof ContentDivider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => (
    <div style={{ minHeight: 120 }}>
      <ContentDivider {...args} />
    </div>
  ),
};
