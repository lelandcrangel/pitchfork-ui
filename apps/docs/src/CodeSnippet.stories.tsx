import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeSnippet } from '@pitchfork-ui/react';

const sampleCode = `import { Button } from '@pitchfork-ui/react';

export function SaveAction() {
  return (
    <Button variant="primary" onClick={() => console.log('saved')}>
      Save changes
    </Button>
  );
}`;

const meta = {
  title: 'Components/CodeSnippet',
  component: CodeSnippet,
  tags: ['ai-generated', 'test'],
  args: {
    title: 'SaveAction.tsx',
    language: 'tsx',
    code: sampleCode,
    showLineNumbers: false,
    maxHeight: 240,
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
  },
  argTypes: {
    showLineNumbers: { control: 'boolean' },
    maxHeight: { control: { type: 'number', min: 120, max: 600, step: 20 } },
    code: { control: 'text' },
    onCodeCopy: { action: 'code copied' },
  },
} satisfies Meta<typeof CodeSnippet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <CodeSnippet {...args} />,
};
