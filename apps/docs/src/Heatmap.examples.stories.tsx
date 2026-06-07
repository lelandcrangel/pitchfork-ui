import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heatmap, type HeatmapDatum } from '@pitchfork-ui/react';

// Deterministic pseudo-random activity for a stable demo.
function generateActivity(start: string, days: number): HeatmapDatum[] {
  const out: HeatmapDatum[] = [];
  const [y, m, d] = start.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  let seed = 1337;
  for (let i = 0; i < days; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const value = Math.floor((seed / 0x7fffffff) ** 2 * 12);
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    out.push({ date: iso, value });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

const generatorSource = `// Deterministic pseudo-random activity for a stable demo.
function generateActivity(start, days) {
  const out = [];
  const [y, m, d] = start.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  let seed = 1337;
  for (let i = 0; i < days; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const value = Math.floor((seed / 0x7fffffff) ** 2 * 12);
    const iso = cursor.toISOString().slice(0, 10);
    out.push({ date: iso, value });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}`;

const yearData = generateActivity('2025-01-01', 365);
const quarterData = generateActivity('2025-01-01', 90);

const meta = {
  title: 'Examples/Heatmap',
  component: Heatmap,
  tags: ['test', 'examplesHidden'],
  args: { data: [] },
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullYear: Story = {
  name: 'Full year',
  render: () => (
    <Heatmap data={yearData} valueFormatter={(v, date) => `${date}: ${v} contributions`} />
  ),
  parameters: {
    docs: {
      source: {
        code: `${generatorSource}

const data = generateActivity('2025-01-01', 365);

<Heatmap data={data} valueFormatter={(v, date) => \`\${date}: \${v} contributions\`} />`,
      },
    },
  },
};

export const Quarter: Story = {
  name: 'Single quarter',
  render: () => <Heatmap data={quarterData} startDate="2025-01-01" endDate="2025-03-31" />,
  parameters: {
    docs: {
      source: {
        code: `${generatorSource}

const data = generateActivity('2025-01-01', 90);

<Heatmap data={data} startDate="2025-01-01" endDate="2025-03-31" />`,
      },
    },
  },
};

export const CustomColor: Story = {
  name: 'Custom color',
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Heatmap
        data={yearData}
        style={{ '--pf-heatmap-color': 'var(--color-success-500)' } as React.CSSProperties}
      />
      <Heatmap
        data={yearData}
        style={{ '--pf-heatmap-color': 'var(--color-danger-500)' } as React.CSSProperties}
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `${generatorSource}

const data = generateActivity('2025-01-01', 365);

<Heatmap data={data} style={{ '--pf-heatmap-color': 'var(--color-success-500)' }} />
<Heatmap data={data} style={{ '--pf-heatmap-color': 'var(--color-danger-500)' }} />`,
      },
    },
  },
};

export const MondayStart: Story = {
  name: 'Week starts Monday',
  render: () => (
    <Heatmap data={quarterData} startDate="2025-01-01" endDate="2025-03-31" weekStartsOn={1} />
  ),
  parameters: {
    docs: {
      source: {
        code: `${generatorSource}

const data = generateActivity('2025-01-01', 90);

<Heatmap data={data} startDate="2025-01-01" endDate="2025-03-31" weekStartsOn={1} />`,
      },
    },
  },
};

export const Empty: Story = {
  name: 'Empty state',
  render: () => <Heatmap data={[]} startDate="2025-01-01" endDate="2025-03-31" />,
  parameters: {
    docs: {
      source: {
        code: `<Heatmap data={[]} startDate="2025-01-01" endDate="2025-03-31" />`,
      },
    },
  },
};
