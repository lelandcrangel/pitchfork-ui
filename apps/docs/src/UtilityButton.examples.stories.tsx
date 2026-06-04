import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Icon, UtilityButton } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Utility Button',
  component: UtilityButton,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    children: 'Quick action',
    variant: 'neutral',
    size: 'md',
    icon: <Icon name="copy" aria-hidden />,
    onClick: fn(),
  },
} satisfies Meta<typeof UtilityButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Brand: Story = {
  args: {
    variant: 'brand',
    children: 'Create',
    icon: <Icon name="square-check" aria-hidden />,
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Delete',
    icon: <Icon name="circle-xmark" aria-hidden />,
  },
};

export const IconOnly: Story = {
  args: {
    tooltip: 'More options',
    children: undefined,
    icon: <Icon name="copy" aria-hidden />,
  },
  parameters: {
    docs: {
      source: {
        code: `<UtilityButton icon={<Icon name="copy" aria-hidden />} tooltip="More options" />`,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const ClickAction: Story = {
  args: {
    children: 'Run action',
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole('button', { name: /run action/i }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
