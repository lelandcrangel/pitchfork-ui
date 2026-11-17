/**
 * Behaviour every form-associated element shares, tested across all of them
 * at once so a sixteenth control cannot quietly miss it.
 *
 * Browser-only: ElementInternals, `<fieldset disabled>` and `requestSubmit()`
 * exist nowhere else.
 */
import { expect, test } from 'vitest';
import './components/pf-button/pf-button';
import './components/pf-checkbox/pf-checkbox';
import './components/pf-combobox/pf-combobox';
import './components/pf-date-picker/pf-date-picker';
import './components/pf-date-range-picker/pf-date-range-picker';
import './components/pf-file-uploader/pf-file-uploader';
import './components/pf-input/pf-input';
import './components/pf-multi-select/pf-multi-select';
import './components/pf-number-input/pf-number-input';
import './components/pf-radio-button/pf-radio-button';
import './components/pf-radio-group/pf-radio-group';
import './components/pf-rich-text-editor/pf-rich-text-editor';
import './components/pf-select/pf-select';
import './components/pf-slider/pf-slider';
import './components/pf-switch/pf-switch';
import './components/pf-tag-input/pf-tag-input';
import './components/pf-textarea/pf-textarea';
import './components/pf-time-picker/pf-time-picker';
import './components/pf-utility-button/pf-utility-button';

const until = async (predicate: () => boolean, what: string) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const hydrated = () =>
  Array.from(document.body.querySelectorAll('*'))
    .filter((el) => el.tagName.startsWith('PF-'))
    .every((el) => el.classList.contains('hydrated'));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await until(hydrated, 'hydration');
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

/** The native controls a person could type into or press, inside a host. */
const natives = (host: Element) =>
  Array.from(
    host.shadowRoot?.querySelectorAll<HTMLInputElement>('input, button, textarea, select') ?? [],
  ).filter((el) => !el.closest('[popover]'));

const editable = (host: Element) =>
  host.shadowRoot?.querySelector<HTMLElement>('[contenteditable]') ?? null;

const CONTROLS = [
  'pf-checkbox',
  'pf-combobox',
  'pf-date-picker',
  'pf-date-range-picker',
  'pf-file-uploader',
  'pf-input',
  'pf-multi-select',
  'pf-number-input',
  'pf-rich-text-editor',
  'pf-select',
  'pf-slider',
  'pf-switch',
  'pf-tag-input',
  'pf-textarea',
  'pf-time-picker',
];

/*
 * A native control honours `<fieldset disabled>`. Without
 * formDisabledCallback the host dropped out of the submission while the
 * control inside stayed usable, so whatever was typed was silently lost.
 */
test.each(CONTROLS)('%s is disabled by a disabled fieldset, and enabled again', async (tag) => {
  await mount(`<form><fieldset disabled><${tag} name="f" label="F"></${tag}></fieldset></form>`);
  const host = document.querySelector(tag)!;
  const fieldset = document.querySelector('fieldset')!;

  const inner = natives(host);
  const box = editable(host);
  expect(inner.length + (box ? 1 : 0)).toBeGreaterThan(0);
  for (const el of inner) expect(el.disabled, `${tag} ${el.tagName}`).toBe(true);
  if (box) expect(box.getAttribute('contenteditable')).toBe('false');

  fieldset.disabled = false;
  await until(
    () =>
      natives(host).some((el) => !el.disabled) ||
      editable(host)?.getAttribute('contenteditable') === 'true',
    `${tag} to enable`,
  );
});

test('pf-radio-group refuses a pick inside a disabled fieldset', async () => {
  await mount(`
    <form><fieldset disabled>
      <pf-radio-group name="plan" legend="Plan" value="free">
        <pf-radio-button value="free">Free</pf-radio-button>
        <pf-radio-button value="pro">Pro</pf-radio-button>
      </pf-radio-group>
    </fieldset></form>`);
  const group = document.querySelector('pf-radio-group') as HTMLElement & { value: string };
  const pro = document.querySelectorAll('pf-radio-button')[1];
  pro.shadowRoot?.querySelector('input')?.click();
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(group.value).toBe('free');
});

test.each(['pf-button', 'pf-utility-button'])(
  '%s type="submit" submits the form around it, and type="reset" resets it',
  async (tag) => {
    await mount(`
      <form>
        <pf-input name="q" value="first"></pf-input>
        <${tag} type="submit" label="Go">Go</${tag}>
        <${tag} type="reset" label="Reset">Reset</${tag}>
      </form>`);
    const form = document.querySelector('form')!;
    let submitted: FormData | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted = new FormData(form);
    });
    const [submit, reset] = Array.from(document.querySelectorAll(tag));

    submit.shadowRoot?.querySelector('button')?.click();
    expect(submitted).not.toBeNull();
    expect(submitted!.get('q')).toBe('first');

    const input = document.querySelector('pf-input') as HTMLElement & { value: string };
    input.value = 'changed';
    reset.shadowRoot?.querySelector('button')?.click();
    expect(input.value).toBe('first');
  },
);

test('a disabled submit button does not submit', async () => {
  await mount(`<form><pf-button type="submit" disabled>Go</pf-button></form>`);
  let count = 0;
  document.querySelector('form')!.addEventListener('submit', (event) => {
    event.preventDefault();
    count += 1;
  });
  document.querySelector('pf-button')!.shadowRoot?.querySelector('button')?.click();
  expect(count).toBe(0);
});

test('Enter in a pf-input submits its form, as in a native text field', async () => {
  await mount(`<form><pf-input name="q" value="cats"></pf-input></form>`);
  let count = 0;
  document.querySelector('form')!.addEventListener('submit', (event) => {
    event.preventDefault();
    count += 1;
  });
  const input = document.querySelector('pf-input')!.shadowRoot!.querySelector('input')!;
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true }),
  );
  expect(count).toBe(1);
});

test('pf-input checks its type as a native input would', async () => {
  await mount(`<pf-input type="email" value="foo"></pf-input>`);
  const el = document.querySelector('pf-input') as HTMLElement & {
    value: string;
    checkValidity(): Promise<boolean>;
  };
  expect(await el.checkValidity()).toBe(false);

  el.value = 'ada@example.com';
  expect(await el.checkValidity()).toBe(true);
});

// The platform bars a read-only form-associated element from validation; this
// pins that pf-input keeps the attribute on the host, where the rule reads it.
test('a read-only pf-input is not validated, as a native one is not', async () => {
  await mount(`<pf-input required readonly></pf-input>`);
  const el = document.querySelector('pf-input') as HTMLElement & {
    checkValidity(): Promise<boolean>;
  };
  expect(await el.checkValidity()).toBe(true);
});

test('pf-button copies ARIA state a wrapper sets on the host onto its own button', async () => {
  await mount(`<pf-button>Menu</pf-button>`);
  const host = document.querySelector('pf-button')!;
  host.setAttribute('aria-expanded', 'true');
  host.setAttribute('aria-haspopup', 'menu');

  const inner = () => host.shadowRoot!.querySelector('button')!;
  await until(
    () => inner().getAttribute('aria-expanded') === 'true',
    'aria-expanded to reach the button',
  );
  expect(inner().getAttribute('aria-haspopup')).toBe('menu');

  host.removeAttribute('aria-expanded');
  await until(() => !inner().hasAttribute('aria-expanded'), 'aria-expanded to be removed');
});
