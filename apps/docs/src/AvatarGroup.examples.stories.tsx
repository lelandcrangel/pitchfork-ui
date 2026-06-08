import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup, type AvatarGroupItem } from '@pitchfork-ui/react';

const team: AvatarGroupItem[] = [
  { name: 'Ada Lovelace' },
  { name: 'Grace Hopper' },
  { name: 'Alan Turing' },
  { name: 'Katherine Johnson' },
  { name: 'Edsger Dijkstra' },
  { name: 'Barbara Liskov' },
];

const meta = {
  title: 'Examples/Avatar Group',
  component: AvatarGroup,
  tags: ['test', 'examplesHidden'],
  args: { avatars: [] },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <AvatarGroup avatars={team} max={4} label="Project team" />,
  parameters: {
    docs: {
      source: {
        code: `const team = [
  { name: 'Ada Lovelace' },
  { name: 'Grace Hopper' },
  { name: 'Alan Turing' },
  { name: 'Katherine Johnson' },
  { name: 'Edsger Dijkstra' },
  { name: 'Barbara Liskov' },
];

<AvatarGroup avatars={team} max={4} label="Project team" />`,
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <AvatarGroup avatars={team} max={4} size="sm" />
      <AvatarGroup avatars={team} max={4} size="md" />
      <AvatarGroup avatars={team} max={4} size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<AvatarGroup avatars={team} max={4} size="sm" />
<AvatarGroup avatars={team} max={4} size="md" />
<AvatarGroup avatars={team} max={4} size="lg" />`,
      },
    },
  },
};

export const ExplicitTotal: Story = {
  name: 'Explicit total',
  render: () => <AvatarGroup avatars={team.slice(0, 3)} max={3} total={42} />,
  parameters: {
    docs: {
      source: {
        code: `// Show 3 avatars but report a larger total → "+39"
<AvatarGroup avatars={team.slice(0, 3)} max={3} total={42} />`,
      },
    },
  },
};
