import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileUploader } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/FileUploader',
  component: FileUploader,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Upload files',
  },
} satisfies Meta<typeof FileUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleFile: Story = {
  args: {
    multiple: false,
    label: 'Upload avatar',
    description: 'Choose a single image file.',
    accept: '.png,.jpg,.jpeg',
    maxFiles: 1,
    maxFileSize: 1024 * 1024,
  },
};

export const LimitedCount: Story = {
  args: {
    description: 'Upload up to two documents.',
    accept: '.pdf,.doc,.docx',
    maxFiles: 2,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    description: 'Uploads are temporarily disabled.',
  },
};

export const WithError: Story = {
  args: {
    error: 'Please upload at least one document before continuing.',
  },
};
