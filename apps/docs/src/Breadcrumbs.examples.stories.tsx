import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs, type BreadcrumbItem } from '@pitchfork-ui/react';

const defaultItems: BreadcrumbItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Dashboard', href: '#' },
  { label: 'Projects', href: '#' },
  { label: 'Pitchfork UI' },
];

const shortPathItems: BreadcrumbItem[] = [{ label: 'Home', href: '#' }, { label: 'Profile' }];

const currentInMiddleItems: BreadcrumbItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Design', href: '#' },
  { label: 'Assets', current: true },
  { label: 'Unused', href: '#' },
];

const meta = {
  title: 'Examples/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Breadcrumbs items={defaultItems} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Home', href: '#' },
  { label: 'Dashboard', href: '#' },
  { label: 'Projects', href: '#' },
  { label: 'Pitchfork UI' },
];

<Breadcrumbs items={items} />`,
      },
    },
  },
};

export const ShortPath: Story = {
  render: () => <Breadcrumbs items={shortPathItems} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Home', href: '#' },
  { label: 'Profile' },
];

<Breadcrumbs items={items} />`,
      },
    },
  },
};

export const CustomSeparator: Story = {
  render: () => <Breadcrumbs items={defaultItems} separator=">" />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Home', href: '#' },
  { label: 'Dashboard', href: '#' },
  { label: 'Projects', href: '#' },
  { label: 'Pitchfork UI' },
];

<Breadcrumbs items={items} separator=">" />`,
      },
    },
  },
};

export const CurrentInMiddle: Story = {
  render: () => <Breadcrumbs items={currentInMiddleItems} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Home', href: '#' },
  { label: 'Design', href: '#' },
  { label: 'Assets', current: true },
  { label: 'Unused', href: '#' },
];

<Breadcrumbs items={items} />`,
      },
    },
  },
};
