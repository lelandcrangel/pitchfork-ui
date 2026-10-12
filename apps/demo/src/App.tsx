import { useState } from 'react';
import { NotificationProvider } from './context/NotificationContext';
import { AppShell } from './components/AppShell';
import { OverviewPage } from './pages/OverviewPage';
import { AudiencePage } from './pages/AudiencePage';
import { SettingsPage } from './pages/SettingsPage';

type Page = 'overview' | 'audience' | 'settings';

function AppInner() {
  const [activePage, setActivePage] = useState<Page>('overview');

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'overview' && <OverviewPage />}
      {activePage === 'audience' && <AudiencePage />}
      {activePage === 'settings' && <SettingsPage />}
    </AppShell>
  );
}

export function App() {
  return (
    <NotificationProvider>
      <AppInner />
    </NotificationProvider>
  );
}
