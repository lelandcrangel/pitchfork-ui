/**
 * One regression test per defect found in the November element audit, each
 * written against the behaviour a person meets rather than an attribute, and
 * each confirmed to fail before its fix.
 */
import { afterEach, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './components/pf-button/pf-button';
import './components/pf-carousel/pf-carousel';
import './components/pf-carousel-slide/pf-carousel-slide';
import './components/pf-command-group/pf-command-group';
import './components/pf-command-item/pf-command-item';
import './components/pf-command-palette/pf-command-palette';
import './components/pf-context-menu/pf-context-menu';
import './components/pf-date-range-picker/pf-date-range-picker';
import './components/pf-file-uploader/pf-file-uploader';
import './components/pf-menu-item/pf-menu-item';
import './components/pf-modal/pf-modal';
import './components/pf-modal-body/pf-modal-body';
import './components/pf-modal-header/pf-modal-header';
import './components/pf-option/pf-option';
import './components/pf-popover/pf-popover';
import './components/pf-rich-text-editor/pf-rich-text-editor';
import './components/pf-select/pf-select';
import './components/pf-slider/pf-slider';
import './components/pf-tag-input/pf-tag-input';
import './components/pf-tooltip/pf-tooltip';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const until = async (predicate: () => boolean, what: string) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await frame();
  }
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await until(
    () =>
      Array.from(document.body.querySelectorAll('*'))
        .filter((el) => el.tagName.startsWith('PF-'))
        .every((el) => el.classList.contains('hydrated')),
    'hydration',
  );
  await frame();
};

const shadow = <T extends Element>(host: Element, selector: string) =>
  host.shadowRoot!.querySelector(selector) as T;

afterEach(() => {
  document.body.innerHTML = '';
});

test('pf-date-range-picker keeps its range when a new one is started and abandoned', async () => {
  await mount(`<pf-date-range-picker value="2024-03-01/2024-03-05"></pf-date-range-picker>`);
  const el = document.querySelector('pf-date-range-picker') as HTMLElement & {
    value: string;
    open: boolean;
  };
  let changes = 0;
  el.addEventListener('pfChange', () => (changes += 1));

  el.open = true;
  await until(() => shadow(el, '[part="panel"]').matches(':popover-open'), 'the panel to open');
  shadow<HTMLButtonElement>(el, 'button[data-day="2024-03-10"]').click();
  await frame();
  el.open = false;
  await until(() => !shadow(el, '[part="panel"]').matches(':popover-open'), 'the panel to close');

  expect(el.value).toBe('2024-03-01/2024-03-05');
  expect(changes).toBe(0);
});

test('pf-rich-text-editor with a starting value satisfies required at once', async () => {
  await mount(`<pf-rich-text-editor required value="<p>Hello</p>"></pf-rich-text-editor>`);
  const el = document.querySelector('pf-rich-text-editor') as HTMLElement & {
    checkValidity(): Promise<boolean>;
  };
  expect(await el.checkValidity()).toBe(true);
});

test('pf-slider submits the value on its step, where the thumb is', async () => {
  await mount(`<form><pf-slider name="s" value="33" step="10" show-value></pf-slider></form>`);
  const el = document.querySelector('pf-slider')!;
  expect(new FormData(document.querySelector('form')!).get('s')).toBe('30');
  expect(shadow(el, '[part="value"]').textContent).toBe('30');
});

test('pf-context-menu set open at load shows itself', async () => {
  await mount(`
    <pf-context-menu open>
      <div>Area</div>
      <pf-menu-item slot="menu" value="copy">Copy</pf-menu-item>
    </pf-context-menu>`);
  const el = document.querySelector('pf-context-menu')!;
  await until(() => shadow(el, '[part="menu"]').matches(':popover-open'), 'the menu to show');
});

test('pf-context-menu hands focus back when it closes', async () => {
  await mount(`
    <button id="before">Before</button>
    <pf-context-menu>
      <div>Area</div>
      <pf-menu-item slot="menu" value="copy">Copy</pf-menu-item>
    </pf-context-menu>`);
  const before = document.getElementById('before')!;
  const el = document.querySelector('pf-context-menu') as HTMLElement & {
    showAt(x: number, y: number): Promise<void>;
    hide(): Promise<void>;
  };
  before.focus();
  await el.showAt(20, 20);
  await until(() => document.activeElement?.tagName === 'PF-MENU-ITEM', 'focus to enter the menu');

  await el.hide();
  await until(() => document.activeElement === before, 'focus to come back');
});

test('pf-popover takes its trigger from the default slot, wherever the content is written', async () => {
  await mount(`
    <pf-popover>
      <div slot="content">Body</div>
      <pf-button>Open</pf-button>
    </pf-popover>`);
  const el = document.querySelector('pf-popover')!;
  await userEvent.click(page.getByRole('button', { name: 'Open' }));
  await until(() => shadow(el, '[part="panel"]').matches(':popover-open'), 'the panel to open');
  await expect
    .element(page.getByRole('button', { name: 'Open', expanded: true }))
    .toBeInTheDocument();
});

test('pf-tooltip describes the button a screen reader actually lands on', async () => {
  await mount(`
    <pf-tooltip>
      <span slot="content">Saves the draft</span>
      <pf-button>Save</pf-button>
    </pf-tooltip>`);
  await expect
    .element(page.getByRole('button', { name: 'Save' }))
    .toHaveAccessibleDescription('Saves the draft');
});

test('pf-modal is named by its header, not by all of its text', async () => {
  await mount(`
    <pf-modal open>
      <pf-modal-header>Delete project</pf-modal-header>
      <pf-modal-body>This cannot be undone.</pf-modal-body>
    </pf-modal>`);
  await expect
    .element(page.getByRole('dialog', { name: 'Delete project', exact: true }))
    .toBeInTheDocument();
});

test('pf-tag-input at its maximum keeps the field usable rather than disabled', async () => {
  await mount(`<pf-tag-input max="1" value="alpha"></pf-tag-input>`);
  const input = shadow<HTMLInputElement>(document.querySelector('pf-tag-input')!, 'input');
  expect(input.disabled).toBe(false);
  expect(input.readOnly).toBe(true);
});

test('pf-command-palette searches a description set as a property', async () => {
  await mount(`
    <pf-command-palette open>
      <pf-command-group>
        <pf-command-item value="open">Open file</pf-command-item>
        <pf-command-item value="new">New file</pf-command-item>
      </pf-command-group>
    </pf-command-palette>`);
  const el = document.querySelector('pf-command-palette')!;
  const [open, created] = Array.from(document.querySelectorAll('pf-command-item')) as Array<
    HTMLElement & { description?: string }
  >;
  // As a framework binding does it: a property, so no attribute exists.
  open.description = 'Recent documents';
  (document.querySelector('pf-command-group') as HTMLElement & { label?: string }).label = 'Files';
  await frame();

  const input = shadow<HTMLInputElement>(el, 'input');
  input.value = 'recent';
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await until(() => created.hasAttribute('hidden'), 'the filter to run');
  expect(open.hasAttribute('hidden')).toBe(false);
});

test('pf-file-uploader submits under a name set after load', async () => {
  await mount(`<form><pf-file-uploader></pf-file-uploader></form>`);
  const el = document.querySelector('pf-file-uploader') as HTMLElement & {
    files: File[];
    name?: string;
  };
  el.files = [new File(['x'], 'a.txt', { type: 'text/plain' })];
  await frame();
  el.name = 'upload';
  await frame();
  const data = new FormData(document.querySelector('form')!);
  expect((data.get('upload') as File | null)?.name).toBe('a.txt');
});

test('pf-select shows an option label without its description', async () => {
  await mount(`
    <pf-select label="Plan" value="classic">
      <pf-option value="classic">Classic<span slot="description">Regular weight</span></pf-option>
      <pf-option value="bold">Bold</pf-option>
    </pf-select>`);
  const el = document.querySelector('pf-select')!;
  expect(shadow(el, '[part="trigger"]').textContent?.trim()).toBe('Classic');
});

test('closing a select because another field was clicked leaves focus on that field', async () => {
  await mount(`
    <input id="other" aria-label="Other" style="display:block;width:200px;height:30px" />
    <div style="height:120px"></div>
    <pf-select label="A"><pf-option value="a">A</pf-option></pf-select>`);
  const select = document.querySelector('pf-select') as HTMLElement & { open: boolean };
  select.open = true;
  await until(() => shadow(select, '[part="listbox"]').matches(':popover-open'), 'the listbox');

  await userEvent.click(page.getByRole('textbox', { name: 'Other' }));
  await until(() => !select.open, 'the select to close');
  await frame();
  expect(document.activeElement?.id).toBe('other');
});

test('pf-carousel autoplay holds still while the pointer is over it', async () => {
  await mount(`
    <pf-carousel auto-play auto-play-interval="40">
      <pf-carousel-slide>One</pf-carousel-slide>
      <pf-carousel-slide>Two</pf-carousel-slide>
      <pf-carousel-slide>Three</pf-carousel-slide>
    </pf-carousel>`);
  const el = document.querySelector('pf-carousel') as HTMLElement & { index: number };
  el.dispatchEvent(new MouseEvent('mouseenter'));
  const held = el.index;
  await sleep(200);
  expect(el.index).toBe(held);

  el.dispatchEvent(new MouseEvent('mouseleave'));
  await until(() => el.index !== held, 'autoplay to resume');
});

test('pf-carousel starts autoplay for slides that arrive after load', async () => {
  await mount(`<pf-carousel auto-play auto-play-interval="40"></pf-carousel>`);
  const el = document.querySelector('pf-carousel') as HTMLElement & { index: number };
  el.innerHTML =
    '<pf-carousel-slide>One</pf-carousel-slide><pf-carousel-slide>Two</pf-carousel-slide>';
  await until(() => el.index !== 0, 'autoplay to start');
});
