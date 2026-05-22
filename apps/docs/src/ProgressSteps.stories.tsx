import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressSteps } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Progress Steps',
  component: ProgressSteps,
  tags: ['ai-generated', 'test'],
  args: {
    orientation: 'horizontal',
    steps: [
      {
        title: 'Account',
        description: 'Create your workspace',
        status: 'complete',
      },
      {
        title: 'Profile',
        description: 'Set your personal details',
        status: 'current',
      },
      {
        title: 'Invite',
        description: 'Add your team members',
        status: 'upcoming',
      },
      { title: 'Finish', description: 'Review and launch', status: 'upcoming' },
    ],
  },
} satisfies Meta<typeof ProgressSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <ProgressSteps {...args} />,
};
