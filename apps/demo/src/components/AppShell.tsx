import {
  PfAvatar,
  PfHeaderNavigation,
  PfNavItem,
  PfNavSection,
  PfSidebarNavigation,
} from '@pitchfork-ui/elements-react';

type Page = 'overview' | 'audience' | 'settings';

interface AppShellProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

interface NavLink {
  label: string;
  page?: Page;
  disabled?: boolean;
}

const headerLinks: NavLink[] = [
  { label: 'Overview', page: 'overview' },
  { label: 'Audience', page: 'audience' },
  { label: 'Settings', page: 'settings' },
];

const sidebarSections: { title: string; items: NavLink[] }[] = [
  {
    title: 'Analytics',
    items: [
      { label: 'Overview', page: 'overview' },
      { label: 'Audience', page: 'audience' },
      { label: 'Real-time', disabled: true },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Settings', page: 'settings' },
      { label: 'Integrations', disabled: true },
      { label: 'API Keys', disabled: true },
    ],
  },
];

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  /*
   * `pf-nav-item` emits no event of its own and renders a plain, non-focusable
   * `<span>` when it has no `href` -- so an item wired only to `onClick` would
   * be a mouse-only navigation. Each item gets a real fragment href and the
   * click is intercepted for the SPA, which is what keeps it keyboard-reachable.
   *
   * Only `current` is set: `currentPage` is the group's answer, written by
   * `pf-sidebar-navigation`/`pf-header-navigation` from this ask.
   */
  const link = (item: NavLink, orientation: 'horizontal' | 'vertical') =>
    item.disabled || !item.page ? (
      <PfNavItem key={item.label} orientation={orientation} disabled>
        {item.label}
      </PfNavItem>
    ) : (
      <PfNavItem
        key={item.label}
        orientation={orientation}
        href={`#${item.page}`}
        current={activePage === item.page}
        onClick={(event) => {
          event.preventDefault();
          onNavigate(item.page!);
        }}
      >
        {item.label}
      </PfNavItem>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PfHeaderNavigation label="Main" style={{ width: '100%' }}>
        <strong slot="brand">Pulse</strong>
        {headerLinks.map((item) => link(item, 'horizontal'))}
        <PfAvatar slot="actions" name="Leland Rangel" size="sm" />
      </PfHeaderNavigation>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flexShrink: 0 }}>
          <PfSidebarNavigation
            label="Sections"
            style={{
              height: '100%',
              minWidth: '14rem',
              borderRadius: 0,
              borderTop: 0,
              borderBottom: 0,
              borderLeft: 0,
            }}
          >
            {sidebarSections.map((section) => (
              <PfNavSection key={section.title}>
                <span slot="title">{section.title}</span>
                {section.items.map((item) => link(item, 'vertical'))}
              </PfNavSection>
            ))}
          </PfSidebarNavigation>
        </div>
        <main style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
