import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-video-player'];

const meta = {
  title: 'Components/VideoPlayer',
  args: {
    aspectRatio: '16/9',
    autoplay: false,
    controls: true,
    loop: false,
    muted: false,
    preload: 'metadata',
    sources: [],
    tracks: [],
    label: 'Product tour',
  },
  argTypes: {
    aspectRatio: { control: 'select', options: ['1/1', '16/9', '4/3'] },
    autoplay: { control: 'boolean' },
    controls: { control: 'boolean' },
    description: { control: 'text' },
    error: { control: 'text' },
    label: { control: 'text' },
    loop: { control: 'boolean' },
    muted: { control: 'boolean' },
    poster: { control: 'text' },
    preload: { control: 'select', options: ['auto', 'metadata', 'none'] },
    sources: { control: 'object' },
    src: { control: 'text' },
    tracks: { control: 'object' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-video-player"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
