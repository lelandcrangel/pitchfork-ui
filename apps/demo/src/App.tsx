import { useState } from 'react';
/*
 * TODO(pitchfork-ui): still on @pitchfork-ui/react, which is being retired.
 * Each of these needs the call site reshaped by hand -- see Foundations/Migrating in Storybook.
 *
 * - Notification: the call site changes shape: icon -> slot; action -> slot
 * - NotificationStack: absorbed by `pf-toaster` — `pf-toaster` is the positioned stack, with `placement` where the React component takes `position`.
 */
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
