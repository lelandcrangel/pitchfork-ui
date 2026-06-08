import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  ContentDivider,
  Input,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Patterns/Login Form',
  tags: ['test'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

const cardStyle: React.CSSProperties = { maxWidth: 400, width: '100%' };
const headingStyle: React.CSSProperties = { margin: 0, fontSize: '1.25rem' };
const subheadingStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: 'var(--color-semantic-text-muted)',
};
const stackStyle: React.CSSProperties = { display: 'grid', gap: 16 };
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const footerTextStyle: React.CSSProperties = {
  color: 'var(--color-semantic-text-muted)',
  fontSize: '0.875rem',
};

export const Default: Story = {
  name: 'Login form',
  render: () => (
    <Card style={cardStyle}>
      <CardHeader>
        <h2 style={headingStyle}>Sign in</h2>
        <p style={subheadingStyle}>Welcome back — enter your details to continue.</p>
      </CardHeader>
      <CardContent style={stackStyle}>
        <Input label="Email" type="email" placeholder="you@example.com" />
        <Input label="Password" type="password" placeholder="••••••••" />
        <div style={rowStyle}>
          <Checkbox label="Remember me" />
          <Button variant="ghost" size="sm">
            Forgot password?
          </Button>
        </div>
        <Button fullWidth>Sign in</Button>
        <ContentDivider label="or" />
        <Button variant="secondary" fullWidth>
          Continue with Google
        </Button>
      </CardContent>
      <CardFooter>
        <span style={footerTextStyle}>
          Don&apos;t have an account? <a href="#">Sign up</a>
        </span>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Card style={{ maxWidth: 400, width: '100%' }}>
  <CardHeader>
    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Sign in</h2>
    <p style={{ margin: '4px 0 0', color: 'var(--color-semantic-text-muted)' }}>
      Welcome back — enter your details to continue.
    </p>
  </CardHeader>
  <CardContent style={{ display: 'grid', gap: 16 }}>
    <Input label="Email" type="email" placeholder="you@example.com" />
    <Input label="Password" type="password" placeholder="••••••••" />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Checkbox label="Remember me" />
      <Button variant="ghost" size="sm">Forgot password?</Button>
    </div>
    <Button fullWidth>Sign in</Button>
    <ContentDivider label="or" />
    <Button variant="secondary" fullWidth>Continue with Google</Button>
  </CardContent>
  <CardFooter>
    <span>Don't have an account? <a href="#">Sign up</a></span>
  </CardFooter>
</Card>`,
      },
    },
  },
};
