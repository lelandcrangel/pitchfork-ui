import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Icon, VisuallyHidden } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { children: '' },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IconButtonLabel: Story = {
  name: 'Accessible icon button',
  render: () => (
    <Button aria-label={undefined}>
      <Icon name="circle-xmark" aria-hidden />
      <VisuallyHidden>Close dialog</VisuallyHidden>
    </Button>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Button>
  <Icon name="circle-xmark" aria-hidden />
  <VisuallyHidden>Close dialog</VisuallyHidden>
</Button>`,
      },
    },
  },
};

export const LiveStatus: Story = {
  name: 'Screen-reader status',
  render: () => (
    <div>
      <p style={{ margin: 0 }}>Auto-saving as you type…</p>
      <VisuallyHidden role="status">All changes saved</VisuallyHidden>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `{/* Announced by screen readers without cluttering the UI */}
<VisuallyHidden role="status">All changes saved</VisuallyHidden>`,
      },
    },
  },
};

export const SkipLink: Story = {
  name: 'Reveal on focus (skip link)',
  render: () => (
    <div>
      <VisuallyHidden as="span" focusable>
        <a href="#main">Skip to main content</a>
      </VisuallyHidden>
      <p style={{ margin: 0 }}>
        Press <kbd>Tab</kbd> — the hidden skip link becomes visible when focused.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<VisuallyHidden focusable>
  <a href="#main">Skip to main content</a>
</VisuallyHidden>`,
      },
    },
  },
};
