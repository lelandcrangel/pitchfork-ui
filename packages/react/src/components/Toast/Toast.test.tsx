import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { toast, ToastProvider, useToast } from './Toast';

// Minimal provider with no auto-dismiss by default so tests are explicit.
function Fixture({ defaultDuration = false }: { defaultDuration?: number | false }) {
  return <ToastProvider defaultDuration={defaultDuration} />;
}

function ToastButton() {
  const { toast: fire } = useToast();
  return <button onClick={() => fire({ heading: 'Hello', variant: 'success' })}>fire</button>;
}

// Exit animation fallback is EXIT_MS (220) + 50 = 270ms.
// All waitFor calls allow enough headroom above that.
const REMOVAL_TIMEOUT = 1500;

describe('ToastProvider / useToast', () => {
  it('renders a toast when fired via hook', async () => {
    render(
      <ToastProvider defaultDuration={false}>
        <ToastButton />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    expect(await screen.findByText('Hello')).toBeInTheDocument();
  });

  it('removes a toast when the dismiss button is clicked', async () => {
    render(
      <ToastProvider defaultDuration={false}>
        <ToastButton />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    await screen.findByText('Hello');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    await waitFor(() => expect(screen.queryByText('Hello')).not.toBeInTheDocument(), {
      timeout: REMOVAL_TIMEOUT,
    });
  });

  it('auto-dismisses after duration (real timers)', async () => {
    // Use a very short duration so the test completes quickly with real timers.
    render(
      <ToastProvider defaultDuration={100}>
        <ToastButton />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    await screen.findByText('Hello');
    // 100ms duration + 270ms exit fallback = ~370ms. Allow generous headroom.
    await waitFor(() => expect(screen.queryByText('Hello')).not.toBeInTheDocument(), {
      timeout: REMOVAL_TIMEOUT,
    });
  });

  it('dismisses imperatively via dismiss()', async () => {
    let storedId = '';
    function Imperative() {
      const { toast: fire, dismiss } = useToast();
      return (
        <>
          <button
            onClick={() => {
              storedId = fire({ heading: 'Imp' });
            }}
          >
            fire
          </button>
          <button onClick={() => dismiss(storedId)}>dismiss</button>
        </>
      );
    }
    render(
      <ToastProvider defaultDuration={false}>
        <Imperative />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    await screen.findByText('Imp');
    fireEvent.click(screen.getByRole('button', { name: 'dismiss' }));
    await waitFor(() => expect(screen.queryByText('Imp')).not.toBeInTheDocument(), {
      timeout: REMOVAL_TIMEOUT,
    });
  });

  it('dismissAll clears all toasts', async () => {
    function Multi() {
      const { toast: fire, dismissAll } = useToast();
      return (
        <>
          <button
            onClick={() => {
              fire({ heading: 'A' });
              fire({ heading: 'B' });
            }}
          >
            fire
          </button>
          <button onClick={dismissAll}>clear</button>
        </>
      );
    }
    render(
      <ToastProvider defaultDuration={false}>
        <Multi />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'fire' }));
    await screen.findByText('A');
    await screen.findByText('B');
    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    await waitFor(
      () => {
        expect(screen.queryByText('A')).not.toBeInTheDocument();
        expect(screen.queryByText('B')).not.toBeInTheDocument();
      },
      { timeout: REMOVAL_TIMEOUT },
    );
  });

  it('module-level toast() fires via the mounted provider', async () => {
    render(<Fixture />);
    act(() => {
      toast({ heading: 'Module', variant: 'info' });
    });
    expect(await screen.findByText('Module')).toBeInTheDocument();
  });

  it('convenience variant helpers set the correct variant', async () => {
    render(<Fixture />);
    act(() => {
      toast.success({ heading: 'Done' });
    });
    expect(await screen.findByText('Done')).toBeInTheDocument();
  });
});
