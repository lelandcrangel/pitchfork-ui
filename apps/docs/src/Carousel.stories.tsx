import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
import { Carousel } from '@pitchfork-ui/react';

type CarouselSlideState = 'multiple' | 'single' | 'empty';

interface CarouselStoryArgs extends ComponentProps<typeof Carousel> {
  slideState: CarouselSlideState;
}

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
      background: `linear-gradient(135deg, color-mix(in srgb, ${slide.tone} 10%, transparent) 0%, transparent 100%)`,
      border:
        '1px solid var(--pf-carousel-slide-border, color-mix(in srgb, currentColor 14%, transparent))',
      borderRadius: 'var(--radius-sm)',
      color: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      justifyContent: 'center',
      margin: 0,
      minHeight: '156px',
      padding: '16px',
    }}
  >
    <h4 style={{ fontSize: '16px', margin: 0 }}>{slide.title}</h4>
    <p
      style={{
        color:
          'var(--pf-carousel-slide-muted-text, var(--color-semantic-text-muted))',
        margin: 0,
        maxWidth: '32ch',
      }}
    >
      {slide.text}
    </p>
  </article>
));

const singleSlide = slides.slice(0, 1);

function getSlidesForState(slideState: CarouselSlideState) {
  if (slideState === 'empty') {
    return [];
  }

  if (slideState === 'single') {
    return singleSlide;
  }

  return slides;
}

const meta = {
  title: 'Components/Carousel',
  component: Carousel,
  tags: ['ai-generated', 'test'],
  args: {
    slides,
    slideState: 'multiple',
    loop: true,
    showIndicators: true,
    autoPlay: false,
    autoPlayInterval: 4000,
  },
  argTypes: {
    slideState: {
      control: 'select',
      options: ['multiple', 'single', 'empty'],
    },
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
  render: ({ slideState, ...args }) => (
    <Carousel {...args} slides={getSlidesForState(slideState)} />
  ),
} satisfies Meta<CarouselStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    slideState: 'multiple',
  },
};
