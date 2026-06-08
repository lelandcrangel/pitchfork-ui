import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Notification, NotificationStack } from '../Notification';
import type { NotificationPlacement, NotificationVariant } from '../Notification';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ToastOptions {
  variant?: NotificationVariant;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Auto-dismiss delay in ms. Pass `false` to keep until manually dismissed. Defaults to 4000. */
  duration?: number | false;
  /** Whether to show the X dismiss button. Defaults to true. */
  dismissible?: boolean;
}

interface ToastEntry extends ToastOptions {
  id: string;
  /** True once the auto-dismiss timer fires — triggers exit animation. */
  shouldExit: boolean;
  dismissible: boolean;
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ─── Module-level emitter (powers the standalone toast() helper) ─────────────

type Emitter = (options: ToastOptions) => string;
let _emit: Emitter | null = null;

// ─── ToastItem ────────────────────────────────────────────────────────────────
// Wraps Notification and handles the two dismiss paths:
//   1. User-initiated: Notification's internal exit animation → onDismiss → remove.
//   2. Auto-dismiss: external shouldExit flag → pf-notification--exiting class →
//      animationend (or fallback timer for reduced-motion) → remove.

const EXIT_MS = 220;

function ToastItem({ entry, onRemove }: { entry: ToastEntry; onRemove: (id: string) => void }) {
  const { id, shouldExit } = entry;

  const handleRemove = useCallback(() => onRemove(id), [onRemove, id]);

  // Fallback for prefers-reduced-motion: animationend won't fire, so remove after timeout.
  useEffect(() => {
    if (!shouldExit) return;
    const t = setTimeout(handleRemove, EXIT_MS + 50);
    return () => clearTimeout(t);
  }, [shouldExit, handleRemove]);

  return (
    <Notification
      variant={entry.variant}
      heading={entry.heading}
      description={entry.description}
      action={entry.action}
      dismissible={entry.dismissible}
      // Path 1 — user clicks X: Notification plays its own exit animation then calls onDismiss.
      onDismiss={handleRemove}
      // Path 2 — auto-dismiss: apply the exiting class externally; remove on animationend.
      className={shouldExit ? 'pf-notification--exiting' : undefined}
      onAnimationEnd={(e: React.AnimationEvent<HTMLDivElement>) => {
        if (shouldExit && e.currentTarget === e.target) handleRemove();
      }}
    />
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────

export interface ToastProviderProps {
  children?: React.ReactNode;
  placement?: NotificationPlacement;
  /** Default auto-dismiss delay for all toasts. Defaults to 4000ms. */
  defaultDuration?: number | false;
}

export function ToastProvider({
  children,
  placement = 'top-right',
  defaultDuration = 4000,
}: ToastProviderProps) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: string) => {
    timers.current.delete(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const signalExit = useCallback((id: string) => {
    timers.current.delete(id);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, shouldExit: true } : e)));
  }, []);

  const toast = useCallback(
    (options: ToastOptions): string => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const duration = options.duration !== undefined ? options.duration : defaultDuration;

      setEntries((prev) => [
        {
          ...options,
          id,
          shouldExit: false,
          dismissible: options.dismissible ?? true,
        },
        ...prev,
      ]);

      if (typeof duration === 'number' && duration > 0) {
        const t = setTimeout(() => signalExit(id), duration);
        timers.current.set(id, t);
      }

      return id;
    },
    [defaultDuration, signalExit],
  );

  const dismiss = useCallback(
    (id: string) => {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      signalExit(id);
    },
    [signalExit],
  );

  const dismissAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    setEntries((prev) => prev.map((e) => ({ ...e, shouldExit: true })));
  }, []);

  // Wire module-level helper.
  useEffect(() => {
    _emit = toast;
    return () => {
      if (_emit === toast) _emit = null;
    };
  }, [toast]);

  // Clean up timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <NotificationStack placement={placement}>
              {entries.map((entry) => (
                <ToastItem key={entry.id} entry={entry} onRemove={remove} />
              ))}
            </NotificationStack>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}

// ─── Standalone helper ────────────────────────────────────────────────────────

/**
 * Fire a toast imperatively from anywhere — no hook needed.
 * Requires a `<ToastProvider>` to be mounted somewhere in the tree.
 */
export function toast(options: ToastOptions): string {
  if (!_emit) {
    console.warn('[pitchfork-ui] toast() called before <ToastProvider> is mounted.');
    return '';
  }
  return _emit(options);
}

toast.info = (opts: Omit<ToastOptions, 'variant'>) => toast({ ...opts, variant: 'info' });
toast.success = (opts: Omit<ToastOptions, 'variant'>) => toast({ ...opts, variant: 'success' });
toast.warning = (opts: Omit<ToastOptions, 'variant'>) => toast({ ...opts, variant: 'warning' });
toast.danger = (opts: Omit<ToastOptions, 'variant'>) => toast({ ...opts, variant: 'danger' });
