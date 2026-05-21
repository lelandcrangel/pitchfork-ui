import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@pitchfork-ui/react';

const meta = {
  component: Card,
  tags: ['ai-generated', 'test'],
  render: () => (
    <Card style={{ maxWidth: 480 }}>
      <CardHeader>
        <strong>Project summary</strong>
      </CardHeader>
      <CardContent>
        This card composes header, content, and footer slots.
      </CardContent>
      <CardFooter style={{ display: 'flex', gap: 8 }}>
        <Button>Save</Button>
        <Button variant="secondary">Cancel</Button>
      </CardFooter>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /cancel/i })).toBeVisible();
  },
};

export const WithLongContent: Story = {
  render: () => (
    <Card style={{ maxWidth: 480 }}>
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
    </Card>
  ),
};
