import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Card, CardContent, CardFooter, CardHeader } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Card',
  component: Card,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

const slotLabel: React.CSSProperties = {
  fontFamily: 'var(--font-family-mono, ui-monospace, monospace)',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-semantic-action-primary)',
};

const slotNote: React.CSSProperties = {
  margin: '0.25rem 0 0',
  fontSize: '0.85rem',
  color: 'var(--color-semantic-text-muted)',
};

export const Anatomy: Story = {
  render: () => (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader>
        <div style={slotLabel}>CardHeader</div>
        <p style={slotNote}>Title / eyebrow area. Padded, with a divider below it.</p>
      </CardHeader>
      <CardContent>
        <div style={slotLabel}>CardContent</div>
        <p style={slotNote}>
          The main body. Padded on all sides; holds the primary content of the card.
        </p>
      </CardContent>
      <CardFooter>
        <div>
          <div style={slotLabel}>CardFooter</div>
          <p style={slotNote}>
            Divider above; lays children out in a row with a gap — ideal for actions.
          </p>
        </div>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>Main body content</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`,
      },
    },
  },
};

export const Basic: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <strong>Project summary</strong>
      </CardHeader>
      <CardContent>This card composes header, content, and footer slots.</CardContent>
      <CardFooter>
        <Button>Save</Button>
        <Button variant="secondary">Cancel</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Card>
  <CardHeader>
    <strong>Project summary</strong>
  </CardHeader>
  <CardContent>
    This card composes header, content, and footer slots.
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
    <Button variant="secondary">Cancel</Button>
  </CardFooter>
</Card>`,
      },
    },
  },
};

export const WithLongContent: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <strong>Release notes</strong>
      </CardHeader>
      <CardContent>
        A longer body demonstrates spacing and section borders while preserving readable rhythm.
      </CardContent>
      <CardFooter>
        <Button variant="ghost">Dismiss</Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Card>
  <CardHeader>
    <strong>Release notes</strong>
  </CardHeader>
  <CardContent>
    A longer body demonstrates spacing and section borders while preserving
    readable rhythm.
  </CardContent>
  <CardFooter>
    <Button variant="ghost">Dismiss</Button>
  </CardFooter>
</Card>`,
      },
    },
  },
};
