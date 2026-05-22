import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { MultiSelect } from '@pitchfork-ui/react';

const options = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'storybook', label: 'Storybook' },
  { value: 'figma', label: 'Figma', disabled: true },
];

const meta = {
  title: 'Examples/Multi Select',
  component: MultiSelect,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Tech stack',
    description: 'Select all tools your team uses daily.',
    placeholder: 'Choose one or more',
    options,
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /tech stack/i });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('option', { name: /react/i }));
    await userEvent.click(canvas.getByRole('option', { name: /typescript/i }));
    await expect(trigger).toHaveTextContent(/react/i);
    await expect(trigger).toHaveTextContent(/typescript/i);
  },
};

export const WithDefaultValues: Story = {
  args: {
    defaultValue: ['react', 'storybook'],
  },
};

export const WithError: Story = {
  args: {
    error: 'Select at least two tools before continuing.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: ['react'],
  },
};
