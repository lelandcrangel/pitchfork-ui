import { createContext, useCallback, useContext, useRef } from 'react';
import { PfToaster } from '@pitchfork-ui/elements-react';

export interface DemoNotification {
  variant: 'info' | 'success' | 'warning' | 'danger';
  heading: string;
  description?: string;
}

interface NotificationContextValue {
  push: (n: DemoNotification) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * One `pf-toaster`, and `push` is a call to its `toast()` method.
 *
 * The React version of this provider kept the list, minted the ids and ran a
 * five-second `setTimeout` per entry, then handed all three to
 * `NotificationStack` to lay out. `pf-toaster` owns every part of that -- it
 * is the positioned region *and* the queue, which is why it is the one element
 * in the library that takes options rather than child elements: a toast is an
 * event that happened, not data the consumer is rendering. So there is nothing
 * left here but the handle.
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const toaster = useRef<HTMLPfToasterElement>(null);

  /*
   * `toast()` is called straight on the element, with no `componentOnReady()`
   * in front of it. That method belongs to Stencil's lazy `dist` output and
   * does **not** exist on the `dist-custom-elements` build the bindings import
   * — measured: the first version of this awaited it and every toast died with
   * `componentOnReady is not a function`, in the browser only, because nothing
   * in either test project renders through the bindings. The custom-elements
   * build upgrades the element as it connects, so by the time a click reaches
   * this the method is a plain class method.
   */
  const push = useCallback((notification: DemoNotification) => {
    void toaster.current?.toast({ ...notification, dismissable: true });
  }, []);

  return (
    <NotificationContext.Provider value={{ push }}>
      {children}
      <PfToaster ref={toaster} placement="top-right" duration={5000} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
