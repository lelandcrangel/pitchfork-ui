import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from '@pitchfork-ui/react';

const demoSlides = [
  {
    title: 'Q2 Product Launch',
    text: 'Track release milestones with slide-based highlights.',
    tone: 'var(--color-semantic-action-primary)',
  },
  {
    title: 'Customer Feedback',
    text: 'Rotate key signals from support and product analytics.',
    tone: '#0284c7',
  },
  {
    title: 'Weekly Metrics',
    text: 'Show revenue, retention, and activation snapshots.',
    tone: '#0f766e',
  },
];

const slides = demoSlides.map((slide) => (
  <article
    key={slide.title}
    style={{
      alignItems: 'flex-start',
      background: `linear-gradient(135deg, ${slide.tone} 0%, color-mix(in srgb, ${slide.tone} 72%, white) 100%)`,
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      justifyContent: 'center',
      minHeight: '180px',
      padding: '16px',
    }}
  >
    <h4 style={{ fontSize: '16px', margin: 0 }}>{slide.title}</h4>
    <p style={{ margin: 0, maxWidth: '32ch', opacity: 0.95 }}>{slide.text}</p>
  </article>
));

const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  tags: ['ai-generated', 'test'],
  args: {
    slides,
    loop: true,
    showIndicators: true,
    autoPlay: false,
    autoPlayInterval: 4000,
  },
  argTypes: {
    initialIndex: { control: { type: 'number', min: 0, max: 4, step: 1 } },
    loop: { control: 'boolean' },
    showIndicators: { control: 'boolean' },
    autoPlay: { control: 'boolean' },
    autoPlayInterval: {
      control: { type: 'number', min: 1000, max: 10000, step: 500 },
    },
    slides: { control: false },
    onIndexChange: { control: false },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Carousel {...args} />,
};
