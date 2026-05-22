import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeSnippet } from '@pitchfork-ui/react';

const compactCode = `const status = getStatus();
return status === 'ok' ? 'Ready' : 'Needs attention';`;

const apiCode = `fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Pitchfork UI' }),
});`;

const longCode = `export function useKeyboardShortcut(
  key: string,
  callback: () => void,
) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === key.toLowerCase()) {
        callback();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, callback]);
}`;

const meta = {
  title: 'Examples/CodeSnippet',
  component: CodeSnippet,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    title: 'example.ts',
    language: 'typescript',
    code: compactCode,
  },
} satisfies Meta<typeof CodeSnippet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLineNumbers: Story = {
  args: {
    title: 'api-request.ts',
    code: apiCode,
    showLineNumbers: true,
  },
};

export const Scrollable: Story = {
  args: {
    title: 'useKeyboardShortcut.ts',
    code: longCode,
    showLineNumbers: true,
    maxHeight: 160,
  },
};

export const ToolbarOnly: Story = {
  args: {
    title: undefined,
    language: undefined,
    code: compactCode,
  },
};
