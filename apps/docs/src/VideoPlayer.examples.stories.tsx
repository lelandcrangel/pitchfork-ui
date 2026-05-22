import type { Meta, StoryObj } from '@storybook/react-vite';
import { VideoPlayer } from '@pitchfork-ui/react';

const DEMO_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const meta = {
  title: 'Examples/Video Player',
  component: VideoPlayer,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Intro video',
    description: 'Watch the short introduction clip.',
    src: DEMO_VIDEO,
    controls: true,
    aspectRatio: '16/9',
  },
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPoster: Story = {
  args: {
    label: 'Product walkthrough',
    poster:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
};

export const MutedLoop: Story = {
  args: {
    label: 'Background loop',
    description: 'Muted looping preview for ambient demos.',
    muted: true,
    loop: true,
    autoPlay: true,
    playsInline: true,
  },
};

export const MultipleSources: Story = {
  args: {
    label: 'Multi-source video',
    src: undefined,
    sources: [
      { src: DEMO_VIDEO, type: 'video/mp4' },
      {
        src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
        type: 'video/webm',
      },
    ],
  },
};

export const WithError: Story = {
  args: {
    src: '',
    error: 'Please provide a valid video source before publishing.',
  },
};
