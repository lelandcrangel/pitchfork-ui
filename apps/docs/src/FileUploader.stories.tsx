import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileUploader } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/FileUploader',
  component: FileUploader,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Attachments',
    description: 'Upload one or more files to include with this request.',
    multiple: true,
    accept: '.png,.jpg,.pdf',
    maxFiles: 3,
    maxFileSize: 2 * 1024 * 1024,
  },
  argTypes: {
    multiple: { control: 'boolean' },
    maxFiles: { control: { type: 'number', min: 1, max: 10, step: 1 } },
    maxFileSize: { control: { type: 'number', min: 100000, max: 10000000, step: 100000 } },
    onFilesChange: { control: false },
    value: { control: false },
    defaultValue: { control: false },
  },
} satisfies Meta<typeof FileUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <FileUploader {...args} />,
};
