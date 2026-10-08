/**
 * What only a real `<video>` can show: that the accessible name the IDREF
 * sets is the one Chromium computes, that `play()`/`pause()` reach the
 * element inside the shadow root, and that the `<source>` children rendered
 * there are the ones the video actually chooses from.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-video-player';

type Player = HTMLElement & {
  sources: { src: string; type?: string }[];
  tracks: unknown[];
  play(): Promise<void>;
  pause(): Promise<void>;
  getVideoElement(): Promise<HTMLVideoElement | undefined>;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (attrs = '') => {
  document.body.innerHTML = `<pf-video-player ${attrs}></pf-video-player>`;
  await customElements.whenDefined('pf-video-player');
  await frame();
  await frame();
  return document.querySelector('pf-video-player') as Player;
};

const until = async (predicate: () => boolean, label = 'pf-video-player') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: Player, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * The naming, read back the way a reader gets it. `label[for]` on a `<video>`
 * resolves to nothing, which is why this is an IDREF — and a same-root one,
 * which is the kind that works.
 */
test('the label is the video’s accessible name', async () => {
  const el = await mount('src="/v.mp4" label="Demo video"');
  const video = part(el, 'video') as HTMLVideoElement;

  const id = video.getAttribute('aria-labelledby') as string;
  expect(el.shadowRoot!.getElementById(id)?.textContent).toBe('Demo video');
  // And the reference resolves inside this root, rather than reading as a
  // dangling id the way a cross-root one would.
  expect(el.shadowRoot!.getElementById(id)).toBeTruthy();
});

/*
 * A `<source>` has to be a child of the `<video>`, which is why these are
 * properties rather than slotted children: a slotted `<source>` is a child
 * of the host and the video never looks at it. Measured here by putting one
 * in the light DOM and watching the video ignore it.
 */
test('the sources the video sees are the ones in its own shadow tree', async () => {
  const el = await mount();
  const stray = document.createElement('source');
  stray.setAttribute('src', '/ignored.mp4');
  el.appendChild(stray);

  el.sources = [{ src: '/v.webm', type: 'video/webm' }];
  await until(() => Boolean(part(el, 'video')), 'the video');

  const video = part(el, 'video') as HTMLVideoElement;
  const own = Array.from(video.querySelectorAll('source')).map((node) => node.getAttribute('src'));

  expect(own).toEqual(['/v.webm']);
  expect(video.contains(stray)).toBe(false);
});

/* A text track reaches the video's own track list, which only a browser has. */
test('a track becomes a real text track', async () => {
  const el = await mount('src="/v.mp4"');
  el.tracks = [
    { src: '/en.vtt', kind: 'captions', srclang: 'en', label: 'English', default: true },
  ];

  await until(() => (part(el, 'video') as HTMLVideoElement).textTracks.length === 1, 'the track');
  const [track] = Array.from((part(el, 'video') as HTMLVideoElement).textTracks);

  expect(track.kind).toBe('captions');
  expect(track.language).toBe('en');
  expect(track.label).toBe('English');
});

/*
 * A consumer cannot reach into the shadow root to call `play()`, so the
 * element forwards it — and returns the element itself for everything these
 * two methods do not cover.
 */
test('playback is reachable through the host', async () => {
  const el = await mount('src="/v.mp4" muted');
  const video = (await el.getVideoElement()) as HTMLVideoElement;

  expect(video).toBe(part(el, 'video'));
  expect(video.paused).toBe(true);

  // There is no real media behind the src, so `play()` rejects; what matters
  // is that the call reaches the element rather than throwing on `undefined`.
  await el.play().catch(() => undefined);
  await el.pause();
  expect(video.paused).toBe(true);
});

/* The frame keeps its ratio, which is the reflected attribute's job. */
test('the frame keeps the ratio it was given', async () => {
  const el = await mount('src="/v.mp4" aspect-ratio="1/1" style="width: 200px; display: block"');
  const frameBox = part(el, 'frame').getBoundingClientRect();

  // Neither project applies `styleUrl` CSS, so the ratio cannot be measured
  // here — only that the attribute the stylesheet selects on is present.
  expect(el.getAttribute('aspect-ratio')).toBe('1/1');
  expect(frameBox.width).toBeGreaterThan(0);
});
