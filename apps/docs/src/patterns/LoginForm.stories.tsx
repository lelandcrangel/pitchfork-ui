import type { Meta, StoryObj } from '@storybook/react-vite';
import { patternStory } from './pattern-story';
import { patternMarkup } from './pattern-markup';

const meta = {
  title: 'Patterns/Login Form',
  tags: ['test'],
} satisfies Meta;

export default meta;

export const Default: StoryObj = {
  name: 'Login form',
  ...patternStory(patternMarkup['login-form']),
};
