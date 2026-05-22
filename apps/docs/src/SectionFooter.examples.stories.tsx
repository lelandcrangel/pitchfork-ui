import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, SectionFooter } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Section Footer',
  component: SectionFooter,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof SectionFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Finalize this section',
    description:
      'Changes are autosaved, but publishing makes them visible to users.',
    actions: (
      <>
        <Button size="sm" variant="secondary">
          Preview
        </Button>
        <Button size="sm">Publish</Button>
      </>
    ),
  },
};

export const NoDivider: Story = {
  args: {
    heading: 'No divider layout',
    description: 'Useful when the parent card already has a border.',
    divider: false,
    actions: <Button size="sm">Continue</Button>,
  },
};

export const EndAlignedActions: Story = {
  args: {
    align: 'end',
    actions: (
      <>
        <Button size="sm" variant="secondary">
          Back
        </Button>
        <Button size="sm">Next step</Button>
      </>
    ),
  },
};
