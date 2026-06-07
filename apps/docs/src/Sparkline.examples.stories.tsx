import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from '@pitchfork-ui/react';

const weeklyRevenue = [420, 380, 510, 470, 620, 580, 700];
const weeklyUsers = [120, 135, 128, 142, 138, 155, 163];
const weeklyErrors = [8, 12, 6, 14, 9, 4, 2];
const flatline = [50, 50, 50, 50, 50, 50, 50];

const meta = {
  title: 'Examples/Sparkline',
  component: Sparkline,
  tags: ['test', 'examplesHidden'],
  args: { data: [] },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
  render: () => <Sparkline data={weeklyRevenue} label="Weekly revenue trend" />,
  parameters: {
    docs: {
      source: {
        code: `const data = [420, 380, 510, 470, 620, 580, 700];

<Sparkline data={data} label="Weekly revenue trend" />`,
      },
    },
  },
};

export const Area: Story = {
  render: () => (
    <Sparkline data={weeklyRevenue} variant="area" label="Weekly revenue trend" endDot />
  ),
  parameters: {
    docs: {
      source: {
        code: `const data = [420, 380, 510, 470, 620, 580, 700];

<Sparkline data={data} variant="area" endDot label="Weekly revenue trend" />`,
      },
    },
  },
};

export const CustomColor: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Sparkline data={weeklyUsers} color="var(--color-success-500)" endDot label="Active users" />
      <Sparkline data={weeklyErrors} color="var(--color-danger-500)" endDot label="Errors" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `const users = [120, 135, 128, 142, 138, 155, 163];
const errors = [8, 12, 6, 14, 9, 4, 2];

<Sparkline data={users} color="var(--color-success-500)" endDot label="Active users" />
<Sparkline data={errors} color="var(--color-danger-500)" endDot label="Errors" />`,
      },
    },
  },
};

export const InTableCell: Story = {
  render: () => (
    <table
      style={{ borderCollapse: 'collapse', fontFamily: 'var(--font-family-sans)', fontSize: 13 }}
    >
      <thead>
        <tr>
          <th
            style={{
              textAlign: 'left',
              padding: '6px 12px',
              borderBottom: '1px solid var(--color-semantic-border-default)',
            }}
          >
            Metric
          </th>
          <th
            style={{
              textAlign: 'right',
              padding: '6px 12px',
              borderBottom: '1px solid var(--color-semantic-border-default)',
            }}
          >
            Value
          </th>
          <th
            style={{
              padding: '6px 12px',
              borderBottom: '1px solid var(--color-semantic-border-default)',
            }}
          >
            7-day trend
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ padding: '6px 12px' }}>Revenue</td>
          <td style={{ padding: '6px 12px', textAlign: 'right' }}>$700</td>
          <td style={{ padding: '6px 12px' }}>
            <Sparkline
              data={weeklyRevenue}
              width={80}
              height={28}
              variant="area"
              endDot
              label="Revenue trend"
            />
          </td>
        </tr>
        <tr>
          <td style={{ padding: '6px 12px' }}>Active users</td>
          <td style={{ padding: '6px 12px', textAlign: 'right' }}>163</td>
          <td style={{ padding: '6px 12px' }}>
            <Sparkline
              data={weeklyUsers}
              width={80}
              height={28}
              color="var(--color-success-500)"
              endDot
              label="User trend"
            />
          </td>
        </tr>
        <tr>
          <td style={{ padding: '6px 12px' }}>Errors</td>
          <td style={{ padding: '6px 12px', textAlign: 'right' }}>2</td>
          <td style={{ padding: '6px 12px' }}>
            <Sparkline
              data={weeklyErrors}
              width={80}
              height={28}
              color="var(--color-danger-500)"
              endDot
              label="Error trend"
            />
          </td>
        </tr>
      </tbody>
    </table>
  ),
  parameters: {
    docs: {
      source: {
        code: `const revenueData = [420, 380, 510, 470, 620, 580, 700];
const usersData = [120, 135, 128, 142, 138, 155, 163];
const errorsData = [8, 12, 6, 14, 9, 4, 2];

<td><Sparkline data={revenueData} width={80} height={28} variant="area" endDot label="Revenue trend" /></td>
<td><Sparkline data={usersData} width={80} height={28} color="var(--color-success-500)" endDot label="User trend" /></td>
<td><Sparkline data={errorsData} width={80} height={28} color="var(--color-danger-500)" endDot label="Error trend" /></td>`,
      },
    },
  },
};

export const Flatline: Story = {
  render: () => <Sparkline data={flatline} label="No change" />,
  parameters: {
    docs: {
      source: {
        code: `const data = [50, 50, 50, 50, 50, 50, 50];

<Sparkline data={data} label="No change" />`,
      },
    },
  },
};
