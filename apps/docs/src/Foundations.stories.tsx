import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  Input,
  Switch,
} from '@pitchfork-ui/react';

function ComponentPreview() {
  return (
    <Card style={{ maxWidth: 520 }}>
      <CardHeader>
        <strong>PitchforkUI MVP</strong>
      </CardHeader>
      <CardContent style={{ display: 'grid', gap: 16 }}>
        <Input label="Project" defaultValue="PitchforkUI" />
        <Checkbox label="Accessible by default" defaultChecked />
        <Switch label="Enable notifications" />
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge variant="brand">React</Badge>
          <Badge variant="success">Tokens</Badge>
          <Badge>Storybook</Badge>
        </div>
      </CardContent>
      <CardFooter style={{ display: 'flex', gap: 8 }}>
        <Button>Save</Button>
        <Button variant="secondary">Cancel</Button>
      </CardFooter>
    </Card>
  );
}

const meta = {
  component: ComponentPreview,
  tags: ['ai-generated', 'test'],
} satisfies Meta<typeof ComponentPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /save/i })).toBeVisible();
  },
};
