import type { Meta, StoryObj } from '@storybook/react-vite';
import { patternStory } from './pattern-story';
import { patternMarkup } from './pattern-markup';

const meta = {
  title: 'Patterns/Multi-step Wizard',
  tags: ['test'],
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  name: 'Multi-step wizard',
  ...patternStory(patternMarkup['multi-step-wizard']),
};
