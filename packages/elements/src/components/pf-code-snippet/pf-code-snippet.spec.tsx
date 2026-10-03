/**
 * The frame, the header and the numbered lines, all of which are markup. The
 * copy button talks to `navigator.clipboard` and the slot needs `slotchange`,
 * so both are in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-code-snippet';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const parts = (root: HTMLElement, name: string) =>
  Array.from(root.shadowRoot?.querySelectorAll<HTMLElement>(`[part="${name}"]`) ?? []);

describe('pf-code-snippet', () => {
  it('is a figure with a header and a code block', async () => {
    const { root } = await render('<pf-code-snippet code="const a = 1;"></pf-code-snippet>');

    expect(part(root, 'figure').tagName.toLowerCase()).toBe('figure');
    expect(part(root, 'header').tagName.toLowerCase()).toBe('figcaption');
    expect(part(root, 'pre').tagName.toLowerCase()).toBe('pre');
    expect(part(root, 'pre').textContent).toContain('const a = 1;');
  });

  it('shows a heading and a language when it has them', async () => {
    const { root } = await render(
      '<pf-code-snippet code="x" heading="example.ts" language="ts"></pf-code-snippet>',
    );

    expect(part(root, 'title').textContent).toBe('example.ts');
    expect(part(root, 'language').textContent).toBe('ts');
  });

  /*
   * One copy button in one place, unlike the React component, which renders
   * the same button twice — once in the header and once in a toolbar for the
   * case with no header.
   */
  it('has one copy button whether or not there is a heading', async () => {
    const bare = await render('<pf-code-snippet code="x"></pf-code-snippet>');
    const titled = await render('<pf-code-snippet code="x" heading="a.ts"></pf-code-snippet>');

    expect(parts(bare.root, 'copy')).toHaveLength(1);
    expect(parts(titled.root, 'copy')).toHaveLength(1);
    expect(part(bare.root, 'title')).toBeNull();
  });

  it('names the copy button and describes it with the live region', async () => {
    const { root } = await render(
      '<pf-code-snippet code="x" copy-label="Copy it"></pf-code-snippet>',
    );
    const button = part(root, 'copy');

    expect(button.textContent).toContain('Copy it');
    expect(button.getAttribute('aria-describedby')).toBe('status');
    expect(root.shadowRoot?.getElementById('status')?.getAttribute('aria-live')).toBe('polite');
  });

  /* The live region is present and empty, or it would not be announced. */
  it('keeps the live region in the tree while it has nothing to say', async () => {
    const { root } = await render('<pf-code-snippet code="x"></pf-code-snippet>');
    const status = root.shadowRoot?.getElementById('status');

    expect(status).toBeTruthy();
    expect(status?.textContent).toBe('');
  });

  it('draws no line numbers by default', async () => {
    const { root } = await render('<pf-code-snippet code="a\nb"></pf-code-snippet>');
    expect(parts(root, 'line')).toHaveLength(0);
  });

  it('numbers each line when asked', async () => {
    const { root } = await render(
      '<pf-code-snippet code="a\nb\nc" show-line-numbers></pf-code-snippet>',
    );

    expect(parts(root, 'line-number').map((node) => node.textContent)).toEqual(['1', '2', '3']);
    expect(parts(root, 'line')).toHaveLength(3);
  });

  /* Nearly every file ends in a newline, and a numbered blank line is not code. */
  it('does not number a trailing newline', async () => {
    const { root } = await render(
      '<pf-code-snippet code="a\nb\n" show-line-numbers></pf-code-snippet>',
    );
    expect(parts(root, 'line-number')).toHaveLength(2);
  });

  it('keeps the author’s own blank lines', async () => {
    const { root } = await render(
      '<pf-code-snippet code="a\n\nb" show-line-numbers></pf-code-snippet>',
    );
    expect(parts(root, 'line-number')).toHaveLength(3);
  });

  it('hides the numbers behind aria so a reader is not read a count', async () => {
    const { root } = await render(
      '<pf-code-snippet code="a\nb" show-line-numbers></pf-code-snippet>',
    );
    expect(
      parts(root, 'line-number').every((node) => node.getAttribute('aria-hidden') === 'true'),
    ).toBe(true);
  });

  it('scrolls past a maximum height', async () => {
    const { root } = await render('<pf-code-snippet code="x" max-height="120"></pf-code-snippet>');

    expect(part(root, 'pre').style.maxHeight).toBe('120px');
    expect(part(root, 'pre').style.overflow).toBe('auto');
  });

  it('sets no height when it was given none', async () => {
    const { root } = await render('<pf-code-snippet code="x"></pf-code-snippet>');
    expect(part(root, 'pre').style.maxHeight).toBe('');
  });

  /*
   * The slot box is collapsed rather than dropped: a slot that is not
   * rendered never fires `slotchange`, so markup added later would stay
   * invisible for good.
   */
  it('keeps the markup slot rendered while nothing is slotted', async () => {
    const { root } = await render('<pf-code-snippet code="x"></pf-code-snippet>');
    const markup = root.shadowRoot?.querySelector('.markup');

    expect(markup?.querySelector('slot')).toBeTruthy();
    expect(markup?.className).toContain('empty');
  });

  /*
   * Highlighting is the consumer's: there is no framework-free renderer to
   * match `prism-react-renderer`, so slotted markup is shown instead of the
   * plain text. The light DOM is read in `componentWillLoad`, so first paint
   * is already right without waiting for `slotchange`.
   */
  it('shows slotted markup instead of the plain text', async () => {
    const { root } = await render(
      '<pf-code-snippet code="const a = 1;"><span class="tok">const</span> a = 1;</pf-code-snippet>',
    );

    expect(root.shadowRoot?.querySelector('.markup')?.className).not.toContain('empty');
    expect(root.shadowRoot?.querySelector('.plain')).toBeNull();
  });

  /* And then it offers no line numbers, because it cannot know the lines. */
  it('offers no line numbers alongside slotted markup', async () => {
    const { root } = await render(
      '<pf-code-snippet code="a\nb" show-line-numbers><span>a</span></pf-code-snippet>',
    );

    expect(parts(root, 'line')).toHaveLength(0);
  });
});
