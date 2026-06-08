import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagInput } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/TagInput',
  component: TagInput,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Tags',
    description: 'Press Enter or comma to add a tag.',
  },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: ['react', 'typescript'] },
  render: (args) => <TagInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TagInput
  label="Tags"
  description="Press Enter or comma to add a tag."
  defaultValue={['react', 'typescript']}
/>`,
      },
    },
  },
};

export const WithMax: Story = {
  name: 'Limited to 3 tags',
  args: { max: 3, defaultValue: ['one', 'two'] },
  render: (args) => <TagInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TagInput
  label="Tags"
  description="Press Enter or comma to add a tag."
  max={3}
  defaultValue={['one', 'two']}
/>`,
      },
    },
  },
};

export const EmailValidation: Story = {
  name: 'With validation',
  args: {
    label: 'Invite by email',
    description: 'Only valid email addresses are accepted.',
    placeholder: 'name@example.com',
    validate: (tag: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(tag),
    tagVariant: 'brand',
  },
  render: (args) => <TagInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TagInput
  label="Invite by email"
  description="Only valid email addresses are accepted."
  placeholder="name@example.com"
  tagVariant="brand"
  validate={(tag) => /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(tag)}
/>`,
      },
    },
  },
};

export const WithError: Story = {
  args: { error: 'Add at least one tag.', defaultValue: [] },
  render: (args) => <TagInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TagInput
  label="Tags"
  description="Press Enter or comma to add a tag."
  error="Add at least one tag."
/>`,
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ['locked', 'readonly'] },
  render: (args) => <TagInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TagInput
  label="Tags"
  description="Press Enter or comma to add a tag."
  defaultValue={['locked', 'readonly']}
  disabled
/>`,
      },
    },
  },
};
