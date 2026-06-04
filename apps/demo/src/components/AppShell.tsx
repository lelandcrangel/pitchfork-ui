import { Avatar, HeaderNavigation, SidebarNavigation } from '@pitchfork-ui/react';

type Page = 'overview' | 'audience' | 'settings';

interface AppShellProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  const navItems = [
    { label: 'Overview', onClick: () => onNavigate('overview'), active: activePage === 'overview' },
    { label: 'Audience', onClick: () => onNavigate('audience'), active: activePage === 'audience' },
    { label: 'Settings', onClick: () => onNavigate('settings'), active: activePage === 'settings' },
  ];

  const sidebarSections = [
    {
      title: 'Analytics',
      items: [
        {
          label: 'Overview',
          onClick: () => onNavigate('overview'),
          active: activePage === 'overview',
        },
        {
          label: 'Audience',
          onClick: () => onNavigate('audience'),
          active: activePage === 'audience',
        },
        { label: 'Real-time', disabled: true },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          label: 'Settings',
          onClick: () => onNavigate('settings'),
          active: activePage === 'settings',
        },
        { label: 'Integrations', disabled: true },
        { label: 'API Keys', disabled: true },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <HeaderNavigation
        brand="Pulse"
        items={navItems}
        actions={<Avatar name="Leland Rangel" size="sm" />}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flexShrink: 0 }}>
          <SidebarNavigation
            sections={sidebarSections}
            style={{
              height: '100%',
              borderRadius: 0,
              borderTop: 0,
              borderBottom: 0,
              borderLeft: 0,
            }}
          />
        </div>
        <main style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}>{children}</main>
      </div>
    </div>
  );
}
