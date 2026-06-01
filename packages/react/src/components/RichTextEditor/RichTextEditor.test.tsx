import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RichTextEditor } from './RichTextEditor';

beforeEach(() => {
  document.execCommand = vi.fn(() => true);
});

describe('RichTextEditor', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders the editor with role textbox', () => {
    render(<RichTextEditor />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders the formatting toolbar', () => {
    render(<RichTextEditor />);
    expect(screen.getByRole('toolbar', { name: 'Formatting options' })).toBeInTheDocument();
  });

  it('renders bold, italic, and underline toolbar buttons', () => {
    render(<RichTextEditor />);
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Underline' })).toBeInTheDocument();
  });

  it('renders bulleted list, numbered list, and clear formatting buttons', () => {
    render(<RichTextEditor />);
    expect(screen.getByRole('button', { name: 'Bulleted list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Numbered list' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear formatting' })).toBeInTheDocument();
  });

  it('marks the editor as multiline', () => {
    render(<RichTextEditor />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-multiline', 'true');
  });

  // ─── Label / field ───────────────────────────────────────────────────────

  it('renders a label when label prop is provided', () => {
    render(<RichTextEditor label="Notes" />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('shows a description', () => {
    render(<RichTextEditor description="Enter your notes here." />);
    expect(screen.getByText('Enter your notes here.')).toBeInTheDocument();
  });

  it('shows an error message', () => {
    render(<RichTextEditor error="This field is required." />);
    expect(screen.getByText('This field is required.')).toBeInTheDocument();
  });

  it('sets aria-invalid when error is provided', () => {
    render(<RichTextEditor error="Required" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when there is no error', () => {
    render(<RichTextEditor />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('sets aria-required when required is true', () => {
    render(<RichTextEditor label="Notes" required />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('wires aria-describedby to the description and error elements', () => {
    render(<RichTextEditor description="Hint" error="Error" />);
    const editor = screen.getByRole('textbox');
    const describedBy = editor.getAttribute('aria-describedby') ?? '';
    const ids = describedBy.split(' ').filter(Boolean);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    ids.forEach((id) => expect(document.getElementById(id)).toBeInTheDocument());
  });

  // ─── Toolbar commands ────────────────────────────────────────────────────

  it('calls execCommand("bold") when the Bold button is clicked', () => {
    render(<RichTextEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect(document.execCommand).toHaveBeenCalledWith('bold');
  });

  it('calls execCommand("italic") when the Italic button is clicked', () => {
    render(<RichTextEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Italic' }));
    expect(document.execCommand).toHaveBeenCalledWith('italic');
  });

  it('calls execCommand("underline") when the Underline button is clicked', () => {
    render(<RichTextEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Underline' }));
    expect(document.execCommand).toHaveBeenCalledWith('underline');
  });

  // ─── Typing / onChange ───────────────────────────────────────────────────

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor onChange={onChange} />);
    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, 'hello');
    expect(onChange).toHaveBeenCalled();
  });

  // ─── characterMax ────────────────────────────────────────────────────────

  it('renders character count when characterMax is set', () => {
    render(<RichTextEditor characterMax={100} />);
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('character counter has aria-live="polite"', () => {
    render(<RichTextEditor characterMax={200} />);
    expect(screen.getByText('0/200')).toHaveAttribute('aria-live', 'polite');
  });

  it('includes character count id in aria-describedby', () => {
    render(<RichTextEditor characterMax={50} />);
    const editor = screen.getByRole('textbox');
    const describedBy = editor.getAttribute('aria-describedby') ?? '';
    const countEl = screen.getByText('0/50');
    expect(describedBy).toContain(countEl.id);
  });

  it('does not render character count when characterMax is not set', () => {
    render(<RichTextEditor />);
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('sets contentEditable to false when disabled', () => {
    render(<RichTextEditor disabled />);
    expect(screen.getByRole('textbox')).toHaveAttribute('contenteditable', 'false');
  });

  it('disables all toolbar buttons when disabled', () => {
    render(<RichTextEditor disabled />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('sets aria-disabled on the editor when disabled', () => {
    render(<RichTextEditor disabled />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not call execCommand when a toolbar button is clicked while disabled', () => {
    render(<RichTextEditor disabled />);
    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  // ─── Ref forwarding ──────────────────────────────────────────────────────

  it('forwards the ref to the editor div', () => {
    const ref = createRef<HTMLDivElement>();
    render(<RichTextEditor ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });
});
