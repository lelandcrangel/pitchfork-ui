/**
 * The markup and the naming. Playback needs a real `<video>`, and the
 * `<source>`/`<track>` children only matter to a browser, so those are in the
 * browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-video-player';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

describe('pf-video-player', () => {
  it('frames a video when it has a source', async () => {
    const { root } = await render('<pf-video-player src="/v.mp4"></pf-video-player>');

    expect(part(root, 'video')?.tagName.toLowerCase()).toBe('video');
    expect(part(root, 'video')?.getAttribute('src')).toBe('/v.mp4');
    expect(part(root, 'empty')).toBeNull();
  });

  it('shows its empty state with no source', async () => {
    const { root } = await render('<pf-video-player></pf-video-player>');

    expect(part(root, 'empty')?.getAttribute('role')).toBe('note');
    expect(part(root, 'empty')?.textContent).toContain('Add a video src');
    expect(part(root, 'video')).toBeNull();
  });

  it('offers the empty state as a slot with a fallback', async () => {
    const { root } = await render('<pf-video-player></pf-video-player>');
    const slot = part(root, 'empty')?.querySelector('slot[name="empty"]');

    expect(slot).toBeTruthy();
    expect(slot?.textContent).toContain('Add a video src');
  });

  /*
   * `label[for]` must point at a labelable element and a `<video>` is not
   * one, so the React component's `htmlFor` was doing nothing at all. A
   * same-root `aria-labelledby` is the association that works.
   */
  it('names the video with an IDREF, not a label for', async () => {
    const { root } = await render(
      '<pf-video-player src="/v.mp4" label="Demo video"></pf-video-player>',
    );

    expect(part(root, 'label')?.tagName.toLowerCase()).toBe('span');
    expect(part(root, 'video')?.getAttribute('aria-labelledby')).toBe('label');
    expect(root.shadowRoot?.getElementById('label')?.textContent).toBe('Demo video');
  });

  it('names nothing when it has no label', async () => {
    const { root } = await render('<pf-video-player src="/v.mp4"></pf-video-player>');

    expect(part(root, 'label')).toBeNull();
    expect(part(root, 'video')?.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('describes the video with its hint and its error', async () => {
    const { root } = await render(
      '<pf-video-player src="/v.mp4" description="A walkthrough." error="Failed to load."></pf-video-player>',
    );
    const describedBy = part(root, 'video')?.getAttribute('aria-describedby') ?? '';

    expect(describedBy.split(' ')).toEqual(['description', 'error']);
    expect(part(root, 'description')?.textContent).toBe('A walkthrough.');
    expect(part(root, 'error')?.textContent).toBe('Failed to load.');
  });

  it('describes nothing it does not have', async () => {
    const { root } = await render('<pf-video-player src="/v.mp4"></pf-video-player>');

    expect(part(root, 'video')?.hasAttribute('aria-describedby')).toBe(false);
    expect(part(root, 'description')).toBeNull();
  });

  it('marks the frame and the video invalid together', async () => {
    const { root } = await render(
      '<pf-video-player src="/v.mp4" error="Failed."></pf-video-player>',
    );

    expect(part(root, 'frame')?.className).toContain('frame--invalid');
    expect(part(root, 'video')?.getAttribute('aria-invalid')).toBe('true');
  });

  /*
   * A `<source>` has to be a child of the `<video>` itself, and slotted
   * content stays in the light DOM — so these are properties rendered into
   * the shadow video rather than slotted children.
   */
  it('renders a source element per encoding, inside the video', async () => {
    const { root } = await render('<pf-video-player></pf-video-player>');
    const node = root as HTMLElement & { sources: { src: string; type?: string }[] };

    node.sources = [
      { src: '/v.webm', type: 'video/webm' },
      { src: '/v.mp4', type: 'video/mp4' },
    ];
    await new Promise((resolve) => setTimeout(resolve, 0));

    const sources = Array.from(part(root, 'video')?.querySelectorAll('source') ?? []);
    expect(sources.map((source) => source.getAttribute('src'))).toEqual(['/v.webm', '/v.mp4']);
    expect(sources[0].getAttribute('type')).toBe('video/webm');
  });

  it('renders a track element per caption, inside the video', async () => {
    const { root } = await render('<pf-video-player src="/v.mp4"></pf-video-player>');
    const node = root as HTMLElement & { tracks: unknown[] };

    node.tracks = [
      { src: '/en.vtt', kind: 'captions', srclang: 'en', label: 'English', default: true },
    ];
    await new Promise((resolve) => setTimeout(resolve, 0));

    const track = part(root, 'video')?.querySelector('track');
    expect(track?.getAttribute('kind')).toBe('captions');
    expect(track?.getAttribute('srclang')).toBe('en');
    expect(track?.getAttribute('label')).toBe('English');
  });

  /*
   * A `sources` that is not an array would throw on `.map`, and Stencil's
   * `safeCall` swallows the error — leaving the *previous* render on screen,
   * so asserting the video is still there passes whether the guard exists or
   * not. The label is set in the same breath as the bad value: it only
   * appears if the render actually completed.
   */
  it('survives a sources value that is not an array', async () => {
    const { root, waitForChanges } = await render(
      '<pf-video-player src="/v.mp4"></pf-video-player>',
    );
    const node = root as HTMLElement & { sources: unknown; tracks: unknown; label: string };

    node.sources = 'nope';
    node.tracks = null;
    node.label = 'Still rendering';
    await waitForChanges();

    expect(part(root, 'label')?.textContent).toBe('Still rendering');
    expect(part(root, 'video')).toBeTruthy();
    expect(part(root, 'video')?.querySelectorAll('source')).toHaveLength(0);
  });

  /* The ratio is reflected, because the stylesheet selects on the attribute. */
  it('reflects its aspect ratio', async () => {
    const { root } = await render(
      '<pf-video-player src="/v.mp4" aspect-ratio="4/3"></pf-video-player>',
    );
    expect(root.getAttribute('aspect-ratio')).toBe('4/3');
  });

  it('is sixteen by nine by default', async () => {
    const { root } = await render('<pf-video-player src="/v.mp4"></pf-video-player>');
    expect(root.getAttribute('aspect-ratio')).toBe('16/9');
  });

  it('shows controls by default and drops them when asked', async () => {
    const withControls = await render('<pf-video-player src="/v.mp4"></pf-video-player>');
    const without = await render(
      '<pf-video-player src="/v.mp4" controls="false"></pf-video-player>',
    );

    expect(part(withControls.root, 'video')?.hasAttribute('controls')).toBe(true);
    expect(part(without.root, 'video')?.hasAttribute('controls')).toBe(false);
  });

  it('preloads metadata rather than the whole file', async () => {
    const { root } = await render('<pf-video-player src="/v.mp4"></pf-video-player>');
    expect(part(root, 'video')?.getAttribute('preload')).toBe('metadata');
  });
});
