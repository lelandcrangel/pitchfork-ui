/**
 * A link's role and name come from the accessibility tree, so they are
 * asserted in a real browser.
 */
import { afterEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import './pf-link';
import '../pf-icon/pf-icon';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.querySelector('pf-link') as HTMLElement;
  while (!el.classList.contains('hydrated')) await frame();
  await frame();
  return el;
};

const anchor = (el: HTMLElement) => el.shadowRoot!.querySelector('a') as HTMLAnchorElement;

afterEach(() => {
  document.body.innerHTML = '';
});

test('is a link to its href, named by its text', async () => {
  const el = await mount('<p>Read the <pf-link href="/guide">guide</pf-link>.</p>');

  await expect.element(page.getByRole('link', { name: 'guide', exact: true })).toBeInTheDocument();
  expect(anchor(el).getAttribute('href')).toBe('/guide');
  expect(anchor(el).hasAttribute('target')).toBe(false);
});

/*
 * An icon alone tells a screen reader nothing, so the new tab is in the name.
 */
test('external opens a new tab safely, and says so', async () => {
  const el = await mount('<pf-link href="https://example.com" external>Status page</pf-link>');

  expect(anchor(el).getAttribute('target')).toBe('_blank');
  expect(anchor(el).getAttribute('rel')).toBe('noopener noreferrer');
  await expect
    .element(page.getByRole('link', { name: 'Status page (opens in a new tab)', exact: true }))
    .toBeInTheDocument();
});

test('a rel given by the consumer wins', async () => {
  const el = await mount('<pf-link href="https://example.com" external rel="me">Profile</pf-link>');

  expect(anchor(el).getAttribute('rel')).toBe('me');
});

test('focusing the host reaches the anchor', async () => {
  const el = await mount('<pf-link href="/guide">guide</pf-link>');

  el.focus();
  expect(el.shadowRoot!.activeElement).toBe(anchor(el));
});
