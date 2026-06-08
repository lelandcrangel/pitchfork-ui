import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Toolbar, ToolbarSeparator } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  tags: ['ai-generated', 'test'],
  args: {
    orientation: 'horizontal',
    'aria-label': 'Text formatting',
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => (
    <Toolbar {...args}>
      <Button variant="ghost" size="sm">
        Bold
      </Button>
      <Button variant="ghost" size="sm">
        Italic
      </Button>
      <Button variant="ghost" size="sm">
        Underline
      </Button>
      <ToolbarSeparator />
      <Button variant="ghost" size="sm">
        Left
      </Button>
      <Button variant="ghost" size="sm">
        Center
      </Button>
      <Button variant="ghost" size="sm">
        Right
      </Button>
    </Toolbar>
  ),
};
