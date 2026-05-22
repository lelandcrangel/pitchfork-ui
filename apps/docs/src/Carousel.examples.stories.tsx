import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from '@pitchfork-ui/react';

const contentSlides = [
  {
    title: 'Design review',
    text: 'Slides can hold rich content areas and callouts.',
    background: '#111827',
  },
  {
    title: 'Engineering sync',
    text: 'Use a carousel to surface the most recent updates.',
    background: '#1d4ed8',
  },
  {
    title: 'Launch notes',
    text: 'Keep users focused on one panel at a time.',
    background: '#0f766e',
  },
];

const slides = contentSlides.map((slide) => (
  <section
    key={slide.title}
    style={{
      background: `linear-gradient(135deg, ${slide.background} 0%, color-mix(in srgb, ${slide.background} 72%, white) 100%)`,
      color: '#fff',
      minHeight: 180,
      padding: 16,
    }}
  >
    <h4 style={{ margin: 0 }}>{slide.title}</h4>
    <p style={{ marginBottom: 0, marginTop: 8 }}>{slide.text}</p>
  </section>
));

const meta = {
  title: 'Examples/Carousel',
  component: Carousel,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    slides,
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoLoop: Story = {
  args: {
    loop: false,
  },
};

export const AutoPlay: Story = {
  args: {
    autoPlay: true,
    autoPlayInterval: 2500,
  },
};

export const NoIndicators: Story = {
  args: {
    showIndicators: false,
  },
};
