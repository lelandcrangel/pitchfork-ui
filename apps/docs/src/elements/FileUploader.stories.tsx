import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-file-uploader'];

const meta = {
  title: 'Components/FileUploader',
  args: {
    disabled: false,
    files: [],
    multiple: true,
    required: false,
    label: 'Attachments',
    name: 'attachments',
    description: 'PDFs and images, up to 2 MB each.',
    accept: '.pdf,image/*',
    maxFileSize: 2097152,
    maxFiles: 3,
  },
  argTypes: {
    accept: { control: 'text' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    files: { control: 'object' },
    label: { control: 'text' },
    maxFileSize: { control: 'number' },
    maxFiles: { control: 'number' },
    multiple: { control: 'boolean' },
    name: { control: 'text' },
    required: { control: 'boolean' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-file-uploader"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
