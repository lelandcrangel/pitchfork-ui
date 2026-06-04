import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Card, CardContent, CardFooter, CardHeader } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Card',
  component: Card,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

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
