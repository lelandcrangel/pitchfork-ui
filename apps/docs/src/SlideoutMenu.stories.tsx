import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, SlideoutMenu } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Slideout Menus',
  component: SlideoutMenu,
  tags: ['ai-generated', 'test'],
  args: {
    title: 'Edit profile',
    description: 'Update account settings and notification preferences.',
    placement: 'right',
    size: 'md',
    closeOnOverlayClick: true,
    showCloseButton: true,
  },
  argTypes: {
    placement: {
      control: 'select',
      options: ['left', 'right'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    footer: { control: false },
    children: { control: false },
    onOpenChange: { control: false },
  },
} satisfies Meta<typeof SlideoutMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    open: false,
  },
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open slideout</Button>
        <SlideoutMenu
          {...args}
          open={open}
          onOpenChange={setOpen}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save changes</Button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            Slideout menus are useful for editing flows that should keep page
            context visible in the background.
          </p>
          <p style={{ marginBottom: 0 }}>
            You can control placement, size, overlay behavior, and footer
            actions from this interactive story.
          </p>
        </SlideoutMenu>
      </>
    );
  },
};
