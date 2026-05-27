import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, getAvailableIconNames } from '@pitchfork-ui/react';

const regularCount = getAvailableIconNames().length;

const meta = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['ai-generated', 'test'],
  args: {
    name: 'circle-check',
    size: 'lg',
    label: 'Circle check icon',
  },
  argTypes: {
    name: {
      control: 'select',
      options: getAvailableIconNames(),
      description: `Font Awesome Free Regular icon name. Available icons: ${regularCount}.`,
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'lg', 'xl', '2x'],
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Icon {...args} />,
};
