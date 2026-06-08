import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/ScrollArea',
  component: ScrollArea,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const boxStyle: React.CSSProperties = {
  border: '1px solid var(--color-semantic-border-default)',
  borderRadius: 8,
  padding: 12,
};

export const Vertical: Story = {
  render: () => (
    <ScrollArea aria-label="Tags" style={{ ...boxStyle, maxHeight: 180, maxWidth: 280 }}>
      <div style={{ display: 'grid', gap: 8 }}>
        {Array.from({ length: 15 }, (_, i) => (
          <p
            key={i}
            style={{
              margin: 0,
              padding: '8px 12px',
              borderRadius: 6,
              background: 'var(--color-semantic-background-subtle)',
            }}
          >
            Item {i + 1}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ScrollArea aria-label="Tags" style={{ maxHeight: 180, maxWidth: 280 }}>
  <div style={{ display: 'grid', gap: 8 }}>
    {items.map((item) => (
      <p key={item.id}>{item.label}</p>
    ))}
  </div>
</ScrollArea>`,
      },
    },
  },
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea
      orientation="horizontal"
      aria-label="Gallery"
      style={{ ...boxStyle, maxWidth: 360 }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: 96,
              height: 96,
              borderRadius: 8,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--color-semantic-background-subtle)',
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ScrollArea orientation="horizontal" aria-label="Gallery" style={{ maxWidth: 360 }}>
  <div style={{ display: 'flex', gap: 12 }}>
    {photos.map((photo) => (
      <img key={photo.id} src={photo.src} style={{ flexShrink: 0 }} />
    ))}
  </div>
</ScrollArea>`,
      },
    },
  },
};

export const Both: Story = {
  name: 'Both axes',
  render: () => (
    <ScrollArea
      orientation="both"
      aria-label="Grid"
      style={{ ...boxStyle, maxHeight: 200, maxWidth: 320 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 80px)', gap: 8 }}>
        {Array.from({ length: 64 }, (_, i) => (
          <div
            key={i}
            style={{
              height: 48,
              borderRadius: 6,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--color-semantic-background-subtle)',
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ScrollArea orientation="both" aria-label="Grid" style={{ maxHeight: 200, maxWidth: 320 }}>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 80px)', gap: 8 }}>
    {cells}
  </div>
</ScrollArea>`,
      },
    },
  },
};
