import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Card',
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

export const Interactive: Story = {
  render: () => (
    <Card style={{ maxWidth: 480 }}>
      <CardHeader>
        <strong>Interactive card</strong>
      </CardHeader>
      <CardContent>Use this story with the docs controls panel.</CardContent>
      <CardFooter style={{ display: 'flex', gap: 8 }}>
        <Button>Save</Button>
        <Button variant="secondary">Cancel</Button>
      </CardFooter>
    </Card>
  ),
};
