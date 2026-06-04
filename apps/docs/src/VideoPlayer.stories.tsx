import type { Meta, StoryObj } from '@storybook/react-vite';
import { VideoPlayer } from '@pitchfork-ui/react';

const DEMO_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

const meta = {
  title: 'Components/Video Player',
  component: VideoPlayer,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Intro video',
    description: 'Watch the short introduction clip.',
    src: DEMO_VIDEO,
    controls: true,
    aspectRatio: '16/9',
    muted: false,
    loop: false,
    autoPlay: false,
  },
  argTypes: {
    aspectRatio: {
      control: 'select',
      options: ['16/9', '4/3', '1/1'],
    },
    controls: { control: 'boolean' },
    muted: { control: 'boolean' },
    loop: { control: 'boolean' },
    autoPlay: { control: 'boolean' },
    poster: { control: 'text' },
  },
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <VideoPlayer {...args} />,
};
