/**
 * `href` turns the button into a link, which only a real browser can judge:
 * the role, the name and whether it can be focused all come from the
 * accessibility tree and the tab order, not from the markup.
 */
import { afterEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import './pf-button';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.body.firstElementChild as HTMLElement & { disabled: boolean };
  while (!el.classList.contains('hydrated')) await frame();
  await frame();
  return el;
};

const inner = (el: HTMLElement) => el.shadowRoot!.querySelector('[part="button"]') as HTMLElement;

afterEach(() => {
  document.body.innerHTML = '';
});

test('with href it is a link, named by its label', async () => {
  const el = await mount('<pf-button href="/settings" variant="secondary">Settings</pf-button>');

  await expect
    .element(page.getByRole('link', { name: 'Settings', exact: true }))
    .toBeInTheDocument();
  expect(inner(el).localName).toBe('a');
  expect(inner(el).getAttribute('href')).toBe('/settings');
  expect(page.getByRole('button').elements()).toHaveLength(0);
});

test('passes target, rel and download through to the anchor', async () => {
  const el = await mount(
    '<pf-button href="/report.csv" target="_blank" rel="noopener" download="report.csv">Report</pf-button>',
  );

  expect(inner(el).getAttribute('target')).toBe('_blank');
  expect(inner(el).getAttribute('rel')).toBe('noopener');
  expect(inner(el).getAttribute('download')).toBe('report.csv');
});

/*
 * An anchor has no disabled state: `aria-disabled` alone leaves it in the tab
 * order and still navigating. Dropping the href is what takes it out.
 */
test('a disabled link drops its href, leaves the tab order and says so', async () => {
  const el = await mount('<pf-button href="/settings" disabled>Settings</pf-button>');

  expect(inner(el).hasAttribute('href')).toBe(false);
  await expect
    .element(page.getByRole('link', { name: 'Settings', exact: true }))
    .toHaveAttribute('aria-disabled', 'true');

  el.focus();
  expect(el.shadowRoot!.activeElement).toBeNull();

  el.disabled = false;
  while (!inner(el).hasAttribute('href')) await frame();
  el.focus();
  expect(el.shadowRoot!.activeElement).toBe(inner(el));
});

test('without href it is still a button', async () => {
  const el = await mount('<pf-button>Save</pf-button>');

  expect(inner(el).localName).toBe('button');
  await expect.element(page.getByRole('button', { name: 'Save', exact: true })).toBeInTheDocument();
});
