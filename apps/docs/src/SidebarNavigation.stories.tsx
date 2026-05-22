import type { Meta, StoryObj } from '@storybook/react-vite';
import { SidebarNavigation } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Sidebar Navigations',
  component: SidebarNavigation,
  tags: ['ai-generated', 'test'],
  args: {
    header: 'Workspace',
    sections: [
      {
        title: 'Main',
        items: [
          { label: 'Overview', active: true },
          { label: 'Projects' },
          { label: 'Billing', badge: '2' },
        ],
      },
      {
        title: 'Settings',
        items: [{ label: 'Users' }, { label: 'Roles' }, { label: 'API keys' }],
      },
    ],
    footer: 'Signed in as team-admin',
  },
  argTypes: {
    sections: { control: 'object' },
  },
} satisfies Meta<typeof SidebarNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <SidebarNavigation {...args} />,
};
