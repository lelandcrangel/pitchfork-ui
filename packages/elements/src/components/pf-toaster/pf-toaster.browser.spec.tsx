/**
 * pf-toaster is browser-tested because every claim worth making about it
 * involves the queue outliving a frame: Stencil's queue is `async`, so a
 * re-render provoked by a method lands several frames after the call, and the
 * exit path waits on a real animation.
 */
import { expect, test } from 'vitest';
import './pf-toaster';
import '../pf-notification/pf-notification';

type Toaster = HTMLElement & {
  placement: string;
  duration: number;
  toast(options?: Record<string, unknown>): Promise<string>;
  dismiss(id: string): Promise<void>;
  dismissAll(): Promise<void>;
};

const mount = async (attrs = '') => {
  document.body.innerHTML = `<pf-toaster ${attrs}></pf-toaster>`;
  await customElements.whenDefined('pf-toaster');
  await customElements.whenDefined('pf-notification');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-toaster') as Toaster;
};

const until = async (predicate: () => boolean, label = 'pf-toaster') => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const toasts = (el: Toaster) =>
  Array.from(el.shadowRoot?.querySelectorAll('pf-notification') ?? []);

test('starts empty', async () => {
  const el = await mount();
  expect(toasts(el)).toHaveLength(0);
});

test('shows a toast and passes its options down', async () => {
  const el = await mount('duration="0"');

  await el.toast({ variant: 'success', heading: 'Saved', description: 'All good' });
  await until(() => toasts(el).length === 1);

  const toast = toasts(el)[0];
  expect(toast.getAttribute('variant')).toBe('success');
  expect(toast.shadowRoot?.querySelector('[part="title"]')?.textContent).toBe('Saved');
  expect(toast.shadowRoot?.querySelector('[part="body"]')?.textContent).toContain('All good');
});

/* Newest first, so a stack in a top corner grows away from the corner. */
test('stacks the newest first', async () => {
  const el = await mount('duration="0"');

  await el.toast({ heading: 'First' });
  await el.toast({ heading: 'Second' });
  await until(() => toasts(el).length === 2);

  const headings = toasts(el).map(
    (toast) => toast.shadowRoot?.querySelector('[part="title"]')?.textContent,
  );
  expect(headings).toEqual(['Second', 'First']);
});

test('dismisses itself after its duration', async () => {
  const el = await mount('duration="80"');

  await el.toast({ heading: 'Briefly' });
  await until(() => toasts(el).length === 1);
  await until(() => toasts(el).length === 0, 'the toast to time out');
});

/* duration="0" is the "stays until dismissed" case, not "goes immediately". */
test('a zero duration keeps it until something dismisses it', async () => {
  const el = await mount('duration="0"');

  const id = await el.toast({ heading: 'Sticky' });
  await until(() => toasts(el).length === 1);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(toasts(el)).toHaveLength(1);

  await el.dismiss(id);
  await until(() => toasts(el).length === 0, 'the explicit dismiss');
});

/* A per-toast duration beats the region's default, in both directions. */
test('a toast can override the default duration', async () => {
  const el = await mount('duration="0"');

  await el.toast({ heading: 'Short', duration: 80 });
  await until(() => toasts(el).length === 1);
  await until(() => toasts(el).length === 0, 'the per-toast timeout');
});

test('dismissAll clears the stack', async () => {
  const el = await mount('duration="0"');

  await el.toast({ heading: 'One' });
  await el.toast({ heading: 'Two' });
  await el.toast({ heading: 'Three' });
  await until(() => toasts(el).length === 3);

  await el.dismissAll();
  await until(() => toasts(el).length === 0, 'dismissAll to empty the stack');
});

test('reports each dismissal with the id toast() returned', async () => {
  const el = await mount('duration="0"');
  const dismissed: string[] = [];
  el.addEventListener('pfToastDismiss', (event) => {
    dismissed.push((event as CustomEvent<{ id: string }>).detail.id);
  });

  const first = await el.toast({ heading: 'One' });
  const second = await el.toast({ heading: 'Two' });
  await until(() => toasts(el).length === 2);

  await el.dismiss(second);
  await until(() => dismissed.length === 1);
  expect(dismissed).toEqual([second]);

  await el.dismiss(first);
  await until(() => dismissed.length === 2);
  expect(dismissed).toEqual([second, first]);
});

/*
 * The dismiss button is the notification's own, and the toaster removes the
 * entry only once the notification says it has finished leaving.
 */
test('the notification dismiss button removes the toast', async () => {
  const el = await mount('duration="0"');

  await el.toast({ heading: 'Close me', dismissable: true });
  await until(() => toasts(el).length === 1);

  const button = toasts(el)[0].shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement;
  expect(button).toBeTruthy();
  button.click();

  await until(() => toasts(el).length === 0, 'the click to remove it');
});

/* Dismissing twice must not double-report or throw. */
test('dismissing the same toast twice reports it once', async () => {
  const el = await mount('duration="0"');
  const dismissed: string[] = [];
  el.addEventListener('pfToastDismiss', (event) => {
    dismissed.push((event as CustomEvent<{ id: string }>).detail.id);
  });

  const id = await el.toast({ heading: 'Once' });
  await until(() => toasts(el).length === 1);

  await Promise.all([el.dismiss(id), el.dismiss(id)]);
  await el.dismiss(id);

  expect(dismissed).toEqual([id]);
  expect(toasts(el)).toHaveLength(0);
});

/* An unknown id is a no-op, not a throw: a caller may dismiss late. */
test('dismissing an id that has already gone is harmless', async () => {
  const el = await mount('duration="0"');
  await expect(el.dismiss('pf-toast-404')).resolves.toBeUndefined();
});

/*
 * Each notification is its own live region, so the container must not be one
 * too — it would announce every toast twice.
 */
test('the stack is not itself a live region', async () => {
  const el = await mount();
  const stack = el.shadowRoot?.querySelector('[part="stack"]') as HTMLElement;

  expect(stack.hasAttribute('aria-live')).toBe(false);
  expect(stack.hasAttribute('role')).toBe(false);
});

test('reflects placement so the stylesheet can position it', async () => {
  const el = await mount('placement="bottom-left"');
  expect(el.getAttribute('placement')).toBe('bottom-left');
});

/* Declarative use still works: a slotted notification sits in the stack. */
test('lays out a slotted notification alongside the queue', async () => {
  document.body.innerHTML = `
    <pf-toaster duration="0">
      <pf-notification heading="From the page"></pf-notification>
    </pf-toaster>`;
  await customElements.whenDefined('pf-toaster');
  await customElements.whenDefined('pf-notification');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-toaster') as Toaster;

  await el.toast({ heading: 'From an action' });
  await until(() => toasts(el).length === 1);

  // One in the shadow queue, one slotted in the light DOM.
  expect(toasts(el)).toHaveLength(1);
  expect(el.querySelectorAll('pf-notification')).toHaveLength(1);
  expect(el.shadowRoot?.querySelector('[part="stack"] slot')).not.toBeNull();
});
