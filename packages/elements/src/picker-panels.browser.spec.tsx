/**
 * A closed picker builds no panel content; the first open builds it, focuses
 * it, and later opens keep it.
 *
 * Measured before this: a closed `pf-date-picker` was 192 DOM nodes,
 * `pf-date-range-picker` 136 and `pf-time-picker` 94, so a form of date
 * fields built hundreds of nodes nobody had asked to see. See
 * `src/deferred-panel.ts`.
 */
import { afterEach, expect, test } from 'vitest';
import './components/pf-calendar/pf-calendar';
import './components/pf-date-picker/pf-date-picker';
import './components/pf-date-range-picker/pf-date-range-picker';
import './components/pf-icon/pf-icon';
import './components/pf-time-picker/pf-time-picker';

type Picker = HTMLElement & { open: boolean; show(): Promise<void>; hide(): Promise<void> };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const until = async (predicate: () => boolean, what: string) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await frame();
  }
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.body.firstElementChild as Picker;
  await until(() => el.classList.contains('hydrated'), 'hydration');
  for (let i = 0; i < 4; i += 1) await frame();
  return el;
};

const panel = (el: Picker) => el.shadowRoot!.querySelector('[part="panel"]') as HTMLElement;
const isShown = (el: Picker) => panel(el).matches(':popover-open');
/** What the panel holds, through nested shadow roots: the cost of building it. */
const built = (el: Picker) => panel(el).querySelectorAll('*').length;

afterEach(() => {
  document.body.innerHTML = '';
});

const PICKERS = [
  ['pf-date-picker', 'value="2024-03-15"'],
  ['pf-date-range-picker', 'value="2024-03-01/2024-03-05"'],
  ['pf-time-picker', 'value="14:30"'],
] as const;

for (const [tag, attrs] of PICKERS) {
  test(`${tag} builds its panel on the first open, and keeps it`, async () => {
    const el = await mount(`<${tag} ${attrs}></${tag}>`);
    expect(built(el)).toBe(0);

    await el.show();
    await until(() => isShown(el), 'the panel to open');
    const content = built(el);
    expect(content).toBeGreaterThan(0);
    // Focus moves into the new content, which had to render first.
    await until(() => {
      const focused = el.shadowRoot!.activeElement;
      return focused !== null && panel(el).contains(focused);
    }, 'focus to move into the panel');

    await el.hide();
    await until(() => !isShown(el), 'the panel to close');
    expect(built(el)).toBe(content);

    await el.show();
    await until(() => isShown(el), 'the panel to open again');
  });

  /* `@Watch` does not run for a starting value, so this needs its own path. */
  test(`${tag} opened in markup shows its panel at load`, async () => {
    const el = await mount(`<${tag} ${attrs} open></${tag}>`);
    await until(() => isShown(el), 'the panel to show');
    expect(built(el)).toBeGreaterThan(0);
  });
}
