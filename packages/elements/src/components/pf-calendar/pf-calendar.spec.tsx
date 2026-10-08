/**
 * The markup and the grid's shape, which the fast project can see. Focus
 * movement and the keyboard are in the browser spec — the mock DOM does not
 * move focus.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-calendar';

const grid = (root: HTMLElement) => root.shadowRoot?.querySelector('[part="grid"]') as HTMLElement;
const days = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll('button[data-day]') ?? []);
const dayFor = (root: HTMLElement, iso: string) =>
  root.shadowRoot?.querySelector(`button[data-day="${iso}"]`) ?? null;

describe('pf-calendar', () => {
  it('is a grid with seven column headers', async () => {
    const { root } = await render(`<pf-calendar value="2024-03-15"></pf-calendar>`);

    expect(grid(root).getAttribute('role')).toBe('grid');
    expect(root.shadowRoot?.querySelectorAll('[role="columnheader"]')).toHaveLength(7);
    expect(root.shadowRoot?.querySelectorAll('[role="row"]')).toHaveLength(7); // 1 header + 6 weeks
  });

  it('renders six weeks of days', async () => {
    const { root } = await render(`<pf-calendar value="2024-03-15"></pf-calendar>`);
    expect(days(root)).toHaveLength(42);
  });

  it('opens on the month of its value', async () => {
    const { root } = await render(`<pf-calendar value="2024-03-15"></pf-calendar>`);

    expect(grid(root).getAttribute('aria-label')).toContain('March 2024');
    expect(dayFor(root, '2024-03-15')).not.toBeNull();
  });

  it('marks the selected day, and only that one', async () => {
    const { root } = await render(`<pf-calendar value="2024-03-15"></pf-calendar>`);

    const selected = days(root).filter((day) => day.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0].getAttribute('data-day')).toBe('2024-03-15');
  });

  /* One tab stop for the whole grid: the arrows do the rest. */
  it('has exactly one tab stop', async () => {
    const { root } = await render(`<pf-calendar value="2024-03-15"></pf-calendar>`);

    const stops = days(root).filter((day) => day.getAttribute('tabindex') === '0');
    expect(stops).toHaveLength(1);
    expect(stops[0].getAttribute('data-day')).toBe('2024-03-15');
  });

  it('names each day in full for a screen reader', async () => {
    const { root } = await render(`<pf-calendar value="2024-03-15"></pf-calendar>`);
    expect(dayFor(root, '2024-03-15')?.getAttribute('aria-label')).toBe('Friday, March 15, 2024');
  });

  /*
   * aria-disabled rather than `disabled`, so focus can still cross a blocked
   * stretch — the ARIA pattern is that focus moves freely and activation is
   * what gets refused.
   */
  it('marks days outside min/max as disabled without making them unfocusable', async () => {
    const { root } = await render(
      `<pf-calendar value="2024-03-15" min="2024-03-10" max="2024-03-20"></pf-calendar>`,
    );

    expect(dayFor(root, '2024-03-05')?.getAttribute('aria-disabled')).toBe('true');
    expect(dayFor(root, '2024-03-25')?.getAttribute('aria-disabled')).toBe('true');
    expect(dayFor(root, '2024-03-15')?.getAttribute('aria-disabled')).toBeNull();
    expect(dayFor(root, '2024-03-05')?.hasAttribute('disabled')).toBe(false);
  });

  it('includes both ends of min/max', async () => {
    const { root } = await render(
      `<pf-calendar value="2024-03-15" min="2024-03-10" max="2024-03-20"></pf-calendar>`,
    );
    expect(dayFor(root, '2024-03-10')?.getAttribute('aria-disabled')).toBeNull();
    expect(dayFor(root, '2024-03-20')?.getAttribute('aria-disabled')).toBeNull();
  });

  it('marks the outside days it borrows from the neighbours', async () => {
    const { root } = await render(`<pf-calendar value="2024-03-15"></pf-calendar>`);

    // March 2024 starts on a Friday, so the grid opens with late February.
    expect(dayFor(root, '2024-02-29')?.classList.contains('day--outside')).toBe(true);
    expect(dayFor(root, '2024-03-01')?.classList.contains('day--outside')).toBe(false);
  });

  it('can leave the outside days out entirely', async () => {
    const { root } = await render(
      `<pf-calendar value="2024-03-15" show-outside-days="false"></pf-calendar>`,
    );

    expect(dayFor(root, '2024-02-29')).toBeNull();
    expect(days(root)).toHaveLength(31); // March alone
  });

  it('offers a month and a year control', async () => {
    const { root } = await render(
      `<pf-calendar value="2024-03-15" start-year="2020" end-year="2030"></pf-calendar>`,
    );

    const selects = root.shadowRoot?.querySelectorAll('select');
    expect(selects).toHaveLength(2);
    expect(selects?.[0].getAttribute('aria-label')).toBe('Month');
    expect(selects?.[0].querySelectorAll('option')).toHaveLength(12);
    expect(selects?.[1].getAttribute('aria-label')).toBe('Year');
    expect(selects?.[1].querySelectorAll('option')).toHaveLength(11);
  });

  /* The nav buttons stop at the ends of the year range rather than past them. */
  it('disables the month arrows at the ends of the year range', async () => {
    const first = await render(
      `<pf-calendar value="2020-01-15" start-year="2020" end-year="2020"></pf-calendar>`,
    );
    const navs = first.root.shadowRoot?.querySelectorAll('.nav');
    expect(navs?.[0].hasAttribute('disabled')).toBe(true);

    const last = await render(
      `<pf-calendar value="2020-12-15" start-year="2020" end-year="2020"></pf-calendar>`,
    );
    const lastNavs = last.root.shadowRoot?.querySelectorAll('.nav');
    expect(lastNavs?.[1].hasAttribute('disabled')).toBe(true);
  });

  it('ignores a value that is not a real date', async () => {
    const { root } = await render(`<pf-calendar value="2024-02-31"></pf-calendar>`);
    const selected = days(root).filter((day) => day.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(0);
  });
});
