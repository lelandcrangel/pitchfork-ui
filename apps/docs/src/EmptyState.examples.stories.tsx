import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, EmptyState } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/EmptyState',
  component: EmptyState,
  tags: ['examplesHidden'],
  args: {
    heading: '',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <EmptyState
      heading="Nothing here yet"
      description="Create your first item to get started."
      action={<Button size="sm">Create item</Button>}
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<EmptyState
  heading="Nothing here yet"
  description="Create your first item to get started."
  action={<Button size="sm">Create item</Button>}
/>`,
      },
    },
  },
};

export const WithIcon: Story = {
  render: () => (
    <EmptyState
      iconName="folder-open"
      heading="No projects found"
      description="You haven't created any projects yet. Start by creating your first one."
      action={<Button size="sm">New project</Button>}
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<EmptyState
  iconName="folder-open"
  heading="No projects found"
  description="You haven't created any projects yet. Start by creating your first one."
  action={<Button size="sm">New project</Button>}
/>`,
      },
    },
  },
};

export const SearchNoResults: Story = {
  render: () => (
    <EmptyState
      iconName="magnifying-glass"
      heading={`No results for "dashboard"`}
      description="Try a different search term or clear your filters."
      action={
        <>
          <Button size="sm" variant="secondary">
            Clear filters
          </Button>
          <Button size="sm" variant="ghost">
            Browse all
          </Button>
        </>
      }
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<EmptyState
  iconName="magnifying-glass"
  heading="No results for \\"dashboard\\""
  description="Try a different search term or clear your filters."
  action={
    <>
      <Button size="sm" variant="secondary">Clear filters</Button>
      <Button size="sm" variant="ghost">Browse all</Button>
    </>
  }
/>`,
      },
    },
  },
};

export const NoPermission: Story = {
  render: () => (
    <EmptyState
      iconName="circle-xmark"
      heading="Access restricted"
      description="You don't have permission to view this content. Contact your administrator to request access."
      action={
        <Button size="sm" variant="secondary">
          Request access
        </Button>
      }
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<EmptyState
  iconName="circle-xmark"
  heading="Access restricted"
  description="You don't have permission to view this content. Contact your administrator to request access."
  action={<Button size="sm" variant="secondary">Request access</Button>}
/>`,
      },
    },
  },
};

const panelWrapStyle: React.CSSProperties = {
  border: '1px solid var(--color-semantic-border-default)',
  borderRadius: 'var(--radius-md)',
  maxWidth: 400,
};

export const SmallInPanel: Story = {
  render: () => (
    <div style={panelWrapStyle}>
      <EmptyState
        size="sm"
        iconName="bell"
        heading="No notifications"
        description="You're all caught up."
      />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<EmptyState
  size="sm"
  iconName="bell"
  heading="No notifications"
  description="You're all caught up."
/>`,
      },
    },
  },
};

export const Large: Story = {
  render: () => (
    <EmptyState
      size="lg"
      iconName="file"
      heading="No documents yet"
      description="Upload or create your first document. Collaborate with your team and keep everything in one place."
      action={
        <>
          <Button>Upload document</Button>
          <Button variant="secondary">Create new</Button>
        </>
      }
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<EmptyState
  size="lg"
  iconName="file"
  heading="No documents yet"
  description="Upload or create your first document. Collaborate with your team and keep everything in one place."
  action={
    <>
      <Button>Upload document</Button>
      <Button variant="secondary">Create new</Button>
    </>
  }
/>`,
      },
    },
  },
};
