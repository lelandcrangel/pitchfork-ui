import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from '@pitchfork-ui/react';

const people = [
  { name: 'Ada Lovelace' },
  { name: 'Grace Hopper' },
  { name: 'Alan Turing' },
  { name: 'Katherine Johnson' },
  { name: 'Edsger Dijkstra' },
  { name: 'Barbara Liskov' },
];

const meta = {
  title: 'Components/Avatar Group',
  component: AvatarGroup,
  tags: ['test'],
  args: {
    avatars: people,
    max: 4,
    size: 'md',
  },
  argTypes: {
    max: { control: { type: 'number', min: 1, max: 6 } },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    total: { control: 'number' },
  },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <AvatarGroup {...args} />,
};
