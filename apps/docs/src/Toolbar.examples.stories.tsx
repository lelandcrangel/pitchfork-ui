import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Toolbar, ToolbarSeparator } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Toolbar',
  component: Toolbar,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { 'aria-label': 'Toolbar' },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Toolbar aria-label="Text formatting">
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
  parameters: {
    docs: {
      source: {
        code: `<Toolbar aria-label="Text formatting">
  <Button variant="ghost" size="sm">Bold</Button>
  <Button variant="ghost" size="sm">Italic</Button>
  <Button variant="ghost" size="sm">Underline</Button>
  <ToolbarSeparator />
  <Button variant="ghost" size="sm">Left</Button>
  <Button variant="ghost" size="sm">Center</Button>
  <Button variant="ghost" size="sm">Right</Button>
</Toolbar>`,
      },
    },
  },
};

export const Vertical: Story = {
  render: () => (
    <Toolbar orientation="vertical" aria-label="Tools">
      <Button variant="ghost" size="sm">
        Select
      </Button>
      <Button variant="ghost" size="sm">
        Move
      </Button>
      <ToolbarSeparator />
      <Button variant="ghost" size="sm">
        Zoom
      </Button>
    </Toolbar>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Toolbar orientation="vertical" aria-label="Tools">
  <Button variant="ghost" size="sm">Select</Button>
  <Button variant="ghost" size="sm">Move</Button>
  <ToolbarSeparator />
  <Button variant="ghost" size="sm">Zoom</Button>
</Toolbar>`,
      },
    },
  },
};
