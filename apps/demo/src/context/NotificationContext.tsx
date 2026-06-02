import { createContext, useCallback, useContext, useState } from 'react';

export interface DemoNotification {
  id: string;
  variant: 'info' | 'success' | 'warning' | 'danger';
  heading: string;
  description?: string;
}

interface NotificationContextValue {
  notifications: DemoNotification[];
  push: (n: Omit<DemoNotification, 'id'>) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);

  const push = useCallback((n: Omit<DemoNotification, 'id'>) => {
    const id = String(Date.now());
    setNotifications((prev) => [...prev, { ...n, id }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, push, dismiss }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
