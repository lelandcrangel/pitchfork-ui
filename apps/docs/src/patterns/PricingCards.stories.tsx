import type { Meta, StoryObj } from '@storybook/react-vite';
import { patternStory } from './pattern-story';
import { patternMarkup } from './pattern-markup';

const meta = {
  title: 'Patterns/Pricing Cards',
  tags: ['test'],
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  name: 'Pricing cards',
  ...patternStory(patternMarkup['pricing-cards']),
};
