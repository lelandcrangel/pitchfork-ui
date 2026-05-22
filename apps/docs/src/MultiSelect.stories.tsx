import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiSelect } from '@pitchfork-ui/react';

const options = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'storybook', label: 'Storybook' },
  { value: 'figma', label: 'Figma', disabled: true },
];

const meta = {
  title: 'Components/Multi Select',
  component: MultiSelect,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Tech stack',
    description: 'Select all tools your team uses daily.',
    placeholder: 'Choose one or more',
    options,
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive multi select',
    description: 'Toggle multiple options from the menu.',
  },
};
