import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, SectionFooter } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Section Footers',
  component: SectionFooter,
  tags: ['ai-generated', 'test'],
  args: {
    heading: 'Need to review before publishing?',
    description: 'Resolve pending checks or save this section as draft.',
    align: 'between',
    divider: true,
    actions: (
      <>
        <Button size="sm" variant="secondary">
          Save draft
        </Button>
        <Button size="sm">Publish changes</Button>
      </>
    ),
  },
  argTypes: {
    actions: { control: false },
  },
} satisfies Meta<typeof SectionFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <SectionFooter {...args} />,
};
