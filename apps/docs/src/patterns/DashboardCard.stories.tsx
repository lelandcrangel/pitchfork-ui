import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  MetricCard,
  MetricGrid,
  Sparkline,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Patterns/Dashboard Card',
  tags: ['test'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const revenueTrend = [32, 35, 33, 40, 38, 45, 44, 52, 50, 58, 61, 67];
const usersTrend = [120, 128, 126, 135, 140, 138, 150, 156, 161, 168, 172, 180];
const churnTrend = [28, 26, 27, 24, 22, 23, 20, 19, 18, 17, 16, 15];

const cardStyle: React.CSSProperties = { maxWidth: 760, width: '100%' };
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
};
const headingStyle: React.CSSProperties = { margin: 0, fontSize: '1.25rem' };
const subheadingStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--color-semantic-text-muted)',
};
const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const footerTextStyle: React.CSSProperties = {
  color: 'var(--color-semantic-text-muted)',
  fontSize: '0.875rem',
};

export const Default: Story = {
  name: 'Dashboard card',
  render: () => (
    <Card style={cardStyle}>
      <CardHeader style={headerStyle}>
        <div>
          <h2 style={headingStyle}>Revenue overview</h2>
          <p style={subheadingStyle}>Last 30 days</p>
        </div>
        <Badge variant="success">+12.5%</Badge>
      </CardHeader>
      <CardContent>
        <MetricGrid>
          <MetricCard heading="Revenue" value="$48,210" trend="positive" trendLabel="12.5%">
            <Sparkline
              data={revenueTrend}
              width={140}
              height={36}
              variant="area"
              endDot
              label="Revenue trend"
            />
          </MetricCard>
          <MetricCard heading="Active users" value="3,492" trend="positive" trendLabel="8.1%">
            <Sparkline
              data={usersTrend}
              width={140}
              height={36}
              color="var(--color-success-500)"
              endDot
              label="Active users trend"
            />
          </MetricCard>
          <MetricCard heading="Churn" value="1.8%" trend="negative" trendLabel="0.4%">
            <Sparkline
              data={churnTrend}
              width={140}
              height={36}
              color="var(--color-danger-500)"
              endDot
              label="Churn trend"
            />
          </MetricCard>
        </MetricGrid>
      </CardContent>
      <CardFooter style={footerStyle}>
        <span style={footerTextStyle}>Updated 2 minutes ago</span>
        <Button variant="ghost" size="sm">
          View full report
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `const revenueTrend = [32, 35, 33, 40, 38, 45, 44, 52, 50, 58, 61, 67];
const usersTrend = [120, 128, 126, 135, 140, 138, 150, 156, 161, 168, 172, 180];
const churnTrend = [28, 26, 27, 24, 22, 23, 20, 19, 18, 17, 16, 15];

<Card style={{ maxWidth: 760 }}>
  <CardHeader style={{ display: 'flex', justifyContent: 'space-between' }}>
    <div>
      <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Revenue overview</h2>
      <p style={{ margin: '4px 0 0', color: 'var(--color-semantic-text-muted)' }}>Last 30 days</p>
    </div>
    <Badge variant="success">+12.5%</Badge>
  </CardHeader>
  <CardContent>
    <MetricGrid>
      <MetricCard heading="Revenue" value="$48,210" trend="positive" trendLabel="12.5%">
        <Sparkline data={revenueTrend} width={140} height={36} variant="area" endDot label="Revenue trend" />
      </MetricCard>
      <MetricCard heading="Active users" value="3,492" trend="positive" trendLabel="8.1%">
        <Sparkline data={usersTrend} width={140} height={36} color="var(--color-success-500)" endDot label="Active users trend" />
      </MetricCard>
      <MetricCard heading="Churn" value="1.8%" trend="negative" trendLabel="0.4%">
        <Sparkline data={churnTrend} width={140} height={36} color="var(--color-danger-500)" endDot label="Churn trend" />
      </MetricCard>
    </MetricGrid>
  </CardContent>
  <CardFooter style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span>Updated 2 minutes ago</span>
    <Button variant="ghost" size="sm">View full report</Button>
  </CardFooter>
</Card>`,
      },
    },
  },
};
