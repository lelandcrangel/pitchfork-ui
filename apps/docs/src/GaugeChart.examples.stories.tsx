import type { Meta, StoryObj } from '@storybook/react-vite';
import { GaugeChart } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/GaugeChart',
  component: GaugeChart,
  tags: ['test', 'examplesHidden'],
  args: { value: 0, max: 100 },
} satisfies Meta<typeof GaugeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <GaugeChart value={67} centerLabel="67%" subLabel="Completion" />,
  parameters: {
    docs: {
      source: {
        code: `<GaugeChart value={67} centerLabel="67%" subLabel="Completion" />`,
      },
    },
  },
};

export const CustomColor: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      <GaugeChart value={82} color="var(--color-success-500)" centerLabel="82%" subLabel="Uptime" />
      <GaugeChart
        value={34}
        color="var(--color-danger-500)"
        centerLabel="34%"
        subLabel="Capacity"
      />
      <GaugeChart value={55} color="var(--color-warning-500)" centerLabel="55%" subLabel="Budget" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<GaugeChart value={82} color="var(--color-success-500)" centerLabel="82%" subLabel="Uptime" />
<GaugeChart value={34} color="var(--color-danger-500)" centerLabel="34%" subLabel="Capacity" />
<GaugeChart value={55} color="var(--color-warning-500)" centerLabel="55%" subLabel="Budget" />`,
      },
    },
  },
};

export const CustomMax: Story = {
  render: () => (
    <GaugeChart value={1240} max={2000} centerLabel="1,240" subLabel="of 2,000 seats" size={220} />
  ),
  parameters: {
    docs: {
      source: {
        code: `<GaugeChart value={1240} max={2000} centerLabel="1,240" subLabel="of 2,000 seats" size={220} />`,
      },
    },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <GaugeChart value={67} size={120} strokeWidth={10} centerLabel="67%" />
      <GaugeChart value={67} size={160} strokeWidth={14} centerLabel="67%" />
      <GaugeChart value={67} size={220} strokeWidth={20} centerLabel="67%" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<GaugeChart value={67} size={120} strokeWidth={10} centerLabel="67%" />
<GaugeChart value={67} size={160} strokeWidth={14} centerLabel="67%" />
<GaugeChart value={67} size={220} strokeWidth={20} centerLabel="67%" />`,
      },
    },
  },
};

export const Empty: Story = {
  render: () => <GaugeChart value={0} centerLabel="0%" subLabel="No data yet" />,
  parameters: {
    docs: {
      source: {
        code: `<GaugeChart value={0} centerLabel="0%" subLabel="No data yet" />`,
      },
    },
  },
};

export const Full: Story = {
  render: () => <GaugeChart value={100} centerLabel="100%" subLabel="Complete" />,
  parameters: {
    docs: {
      source: {
        code: `<GaugeChart value={100} centerLabel="100%" subLabel="Complete" />`,
      },
    },
  },
};
