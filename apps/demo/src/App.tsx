import { useState } from 'react';
import { Notification, NotificationStack } from '@pitchfork-ui/react';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { AppShell } from './components/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { AudiencePage } from './pages/AudiencePage';
import { SettingsPage } from './pages/SettingsPage';

type Page = 'overview' | 'audience' | 'settings';

function AppInner() {
  const [activePage, setActivePage] = useState<Page>('overview');
  const { notifications, dismiss } = useNotifications();

  return (
    <>
      <AppShell activePage={activePage} onNavigate={setActivePage}>
        {activePage === 'overview' && <OverviewPage />}
        {activePage === 'audience' && <AudiencePage />}
        {activePage === 'settings' && <SettingsPage />}
      </AppShell>

      <NotificationStack placement="top-right">
        {notifications.map((n) => (
          <Notification
            key={n.id}
            variant={n.variant}
            heading={n.heading}
            description={n.description}
            dismissible
            onDismiss={() => dismiss(n.id)}
          />
        ))}
      </NotificationStack>
    </>
  );
}

export function App() {
  return (
    <NotificationProvider>
      <AppInner />
    </NotificationProvider>
  );
}
