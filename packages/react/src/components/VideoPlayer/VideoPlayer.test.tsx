import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { VideoPlayer } from './VideoPlayer';

describe('VideoPlayer', () => {
  it('renders a video element when src is provided', () => {
    const { container } = render(<VideoPlayer src="/video.mp4" />);
    expect(container.querySelector('video')).toBeInTheDocument();
  });

  it('shows the empty state when no src or sources are provided', () => {
    render(<VideoPlayer />);
    expect(screen.getByText('Add a video src to display playback.')).toBeInTheDocument();
  });

  /*
   * `label[for]` must point at a labelable element and a `<video>` is not
   * one, so the old `htmlFor` was silently doing nothing — the video had no
   * accessible name at all. `aria-labelledby` is the association that works.
   */
  it('renders a label and names the video with it', () => {
    render(<VideoPlayer src="/v.mp4" label="Demo video" />);
    const label = screen.getByText('Demo video');
    const video = document.querySelector('video') as HTMLVideoElement;

    expect(label.tagName).not.toBe('LABEL');
    expect(video.getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.id).toBeTruthy();
  });

  it('leaves a consumer\u2019s own aria-label alone when it has no label', () => {
    render(<VideoPlayer src="/v.mp4" aria-label="Product tour" />);
    const video = document.querySelector('video') as HTMLVideoElement;

    expect(video.getAttribute('aria-label')).toBe('Product tour');
    expect(video.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('renders the description', () => {
    render(<VideoPlayer src="/v.mp4" description="Watch the walkthrough." />);
    expect(screen.getByText('Watch the walkthrough.')).toBeInTheDocument();
  });

  it('renders an error message', () => {
    render(<VideoPlayer src="/v.mp4" error="Video failed to load." />);
    expect(screen.getByText('Video failed to load.')).toBeInTheDocument();
  });

  it('sets aria-invalid on the video when error is provided', () => {
    render(<VideoPlayer src="/v.mp4" error="Error" />);
    expect(document.querySelector('video')).toHaveAttribute('aria-invalid', 'true');
  });

  it('wires aria-describedby to description and error elements', () => {
    render(<VideoPlayer src="/v.mp4" description="Hint" error="Bad" />);
    const video = document.querySelector('video')!;
    const describedBy = video.getAttribute('aria-describedby') ?? '';
    const ids = describedBy.split(' ').filter(Boolean);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    ids.forEach((id) => expect(document.getElementById(id)).toBeInTheDocument());
  });

  it('forwards ref to the video element', () => {
    const ref = createRef<HTMLVideoElement>();
    render(<VideoPlayer ref={ref} src="/v.mp4" />);
    expect(ref.current).toBeInstanceOf(HTMLVideoElement);
  });
});
