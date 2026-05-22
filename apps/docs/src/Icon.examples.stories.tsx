import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, getAvailableIconNames } from '@pitchfork-ui/react';
import type { IconName } from '@pitchfork-ui/react';

const stackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
};

const iconTileStyle: React.CSSProperties = {
  alignItems: 'center',
  border: '1px solid var(--color-semantic-border-default)',
  borderRadius: 8,
  color: 'var(--color-semantic-text-default)',
  display: 'grid',
  gap: 8,
  justifyItems: 'center',
  minHeight: 74,
  padding: 10,
  textAlign: 'center',
};

const iconNameStyle: React.CSSProperties = {
  color: 'var(--color-semantic-text-muted)',
  fontSize: 12,
  lineHeight: 1.25,
};

const regularNames = getAvailableIconNames() as readonly IconName[];

const IconGrid = ({
  names,
  size,
}: {
  names: readonly IconName[];
  size: 'lg' | '2x' | 'sm';
}) => {
  return (
    <div style={rowStyle}>
      {names.map((name) => (
        <div key={name} style={iconTileStyle}>
          <Icon name={name} size={size} />
          <span style={iconNameStyle}>{name}</span>
        </div>
      ))}
    </div>
  );
};

const meta = {
  title: 'Examples/Icon',
  component: Icon,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    name: 'circle-check',
    label: 'Circle check icon',
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegularSet: Story = {
  render: () => <IconGrid names={regularNames} size="lg" />,
};

export const Sizes: Story = {
  render: () => (
    <div style={stackStyle}>
      <div style={rowStyle}>
        <Icon name="circle-check" size="xs" />
        <Icon name="circle-check" size="sm" />
        <Icon name="circle-check" size="lg" />
        <Icon name="circle-check" size="xl" />
        <Icon name="circle-check" size="2x" />
      </div>
    </div>
  ),
};
