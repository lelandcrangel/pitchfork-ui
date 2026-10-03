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

/*
 * The outer-paragraph strip used to test four conditions that are *all* true
 * of two paragraphs, so a two-paragraph value was cut into the broken
 * fragment `a</p><p>b`. Core's `stripOuterParagraph` checks the one thing
 * that matters: the first closing tag has to be the last.
 */
describe('RichTextEditor value normalisation', () => {
  const editorOf = (container: HTMLElement) =>
    container.querySelector('[contenteditable]') as HTMLDivElement;

  it('drops a single wrapping paragraph', () => {
    const { container } = render(<RichTextEditor value="<p>hello</p>" />);
    expect(editorOf(container).innerHTML).toBe('hello');
  });

  it('leaves two paragraphs intact', () => {
    const { container } = render(<RichTextEditor value="<p>first</p><p>second</p>" />);
    const html = editorOf(container).innerHTML;

    expect(html).toBe('<p>first</p><p>second</p>');
    expect(html).not.toContain('a</p><p>');
    expect(editorOf(container).querySelectorAll('p')).toHaveLength(2);
  });

  it('leaves markup that is not a paragraph alone', () => {
    const { container } = render(<RichTextEditor value="<ul><li>one</li></ul>" />);
    expect(editorOf(container).innerHTML).toBe('<ul><li>one</li></ul>');
  });

  /* ─── Toolbar: one tab stop ────────────────────────────────────────────── *
   *
   * Six focusable buttons, so tabbing past the field walked every one before
   * reaching the text. The ARIA toolbar pattern is one stop with the arrows
   * moving inside — which the element's own toolbar does, and which both now
   * get from the same `useRovingTabIndex`.
   */

  const tools = () => screen.getAllByRole('button');

  it('gives the toolbar one tab stop', () => {
    render(<RichTextEditor />);

    expect(tools().length).toBeGreaterThan(3);
    expect(tools().filter((tool) => tool.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(tools()[0]).toHaveAttribute('tabindex', '0');
  });

  it('moves along the toolbar with the arrows, wrapping at both ends', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor />);
    const buttons = tools();

    buttons[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(buttons[1]).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(buttons.at(-1)).toHaveFocus();
  });

  it('brings the tab stop to whichever tool was focused', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor />);
    const buttons = tools();

    buttons[0].focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');

    expect(buttons[2]).toHaveAttribute('tabindex', '0');
    expect(buttons[0]).toHaveAttribute('tabindex', '-1');
  });

  it('tabs from the toolbar straight into the editor', async () => {
    const user = userEvent.setup();
    const { container } = render(<RichTextEditor />);

    tools()[0].focus();
    await user.tab();

    expect(editorOf(container)).toHaveFocus();
  });
});
