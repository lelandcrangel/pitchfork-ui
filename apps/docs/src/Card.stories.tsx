import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@pitchfork-ui/react';

interface CardStoryArgs {
  id?: string;
  className?: string;
  role?: string;
  title?: string;
  tabIndex?: number;
  maxWidth: number;
  showHeader: boolean;
  headerText: string;
  bodyText: string;
  showFooter: boolean;
  primaryAction: string;
  secondaryAction: string;
}

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['ai-generated', 'test'],
  args: {
    id: '',
    className: '',
    role: 'region',
    title: 'Project summary',
    tabIndex: 0,
    maxWidth: 480,
    showHeader: true,
    headerText: 'Project summary',
    bodyText: 'This card composes header, content, and footer slots.',
    showFooter: true,
    primaryAction: 'Save',
    secondaryAction: 'Cancel',
  },
  argTypes: {
    id: { control: 'text' },
    className: { control: 'text' },
    role: { control: 'text' },
    title: { control: 'text' },
    tabIndex: { control: 'number' },
    maxWidth: { control: { type: 'range', min: 240, max: 720, step: 8 } },
    showHeader: { control: 'boolean' },
    headerText: { control: 'text' },
    bodyText: { control: 'text' },
    showFooter: { control: 'boolean' },
    primaryAction: { control: 'text' },
    secondaryAction: { control: 'text' },
  },
  render: ({
    id,
    className,
    role,
    title,
    tabIndex,
    maxWidth,
    showHeader,
    headerText,
    bodyText,
    showFooter,
    primaryAction,
    secondaryAction,
  }) => (
    <Card
      id={id || undefined}
      className={className || undefined}
      role={role || undefined}
      title={title || undefined}
      tabIndex={tabIndex}
      style={{ maxWidth }}
    >
      {showHeader ? (
        <CardHeader>
          <strong>{headerText}</strong>
        </CardHeader>
      ) : null}
      <CardContent>{bodyText}</CardContent>
      {showFooter ? (
        <CardFooter style={{ display: 'flex', gap: 8 }}>
          <Button>{primaryAction}</Button>
          <Button variant="secondary">{secondaryAction}</Button>
        </CardFooter>
      ) : null}
    </Card>
  ),
} satisfies Meta<CardStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    headerText: 'Interactive card',
    bodyText: 'Use this story with the docs controls panel.',
  },
};
