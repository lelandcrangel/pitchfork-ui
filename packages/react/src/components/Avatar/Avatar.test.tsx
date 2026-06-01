import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  // ─── Image rendering ─────────────────────────────────────────────────────

  it('renders an img when src is provided', () => {
    render(<Avatar src="/photo.jpg" alt="Jane Doe" />);
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('uses the name as alt text when alt is omitted', () => {
    render(<Avatar src="/photo.jpg" name="Jane Doe" />);
    expect(screen.getByRole('img', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('falls back to "Avatar" alt text when neither alt nor name is provided', () => {
    render(<Avatar src="/photo.jpg" />);
    expect(screen.getByRole('img', { name: 'Avatar' })).toBeInTheDocument();
  });

  // ─── Initials fallback ───────────────────────────────────────────────────

  it('renders initials when src is omitted', () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for a single-word name', () => {
    render(<Avatar name="Jane" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders "?" when no name or src is provided', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders children as the fallback content when provided', () => {
    render(<Avatar>AB</Avatar>);
    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  // ─── Size ────────────────────────────────────────────────────────────────

  it('applies the size class', () => {
    const { container } = render(<Avatar name="A B" size="lg" />);
    expect(container.firstChild).toHaveClass('pf-avatar--lg');
  });

  it('defaults to md size', () => {
    const { container } = render(<Avatar name="A B" />);
    expect(container.firstChild).toHaveClass('pf-avatar--md');
  });

  // ─── Ref forwarding ──────────────────────────────────────────────────────

  it('forwards ref to the root span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Avatar ref={ref} name="A B" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
