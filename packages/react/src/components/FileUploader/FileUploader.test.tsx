import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileUploader } from './FileUploader';

const makeFile = (name: string, size = 1024, type = 'image/png') =>
  new File(['x'.repeat(size)], name, { type, lastModified: Date.now() });

describe('FileUploader', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a dropzone button and a hidden file input', () => {
    render(<FileUploader />);
    expect(screen.getByRole('button', { name: /Upload files/i })).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it('associates the label with the file input via htmlFor', () => {
    render(<FileUploader label="Documents" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const label = screen.getByText('Documents');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('shows hint text for accept, maxFileSize, and maxFiles', () => {
    render(<FileUploader accept=".pdf" maxFileSize={1048576} maxFiles={3} />);
    expect(screen.getByText(/Accepted: .pdf/)).toBeInTheDocument();
    expect(screen.getByText(/Max size:/)).toBeInTheDocument();
    expect(screen.getByText(/Max files: 3/)).toBeInTheDocument();
  });

  it('shows description and external error', () => {
    render(<FileUploader label="Docs" description="PDF only" error="File required" />);
    expect(screen.getByText('PDF only')).toBeInTheDocument();
    expect(screen.getByText('File required')).toBeInTheDocument();
  });

  it('shows the required asterisk', () => {
    render(<FileUploader label="Docs" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  // ─── File selection ──────────────────────────────────────────────────────

  it('calls onFilesChange when files are selected', () => {
    const onFilesChange = vi.fn();
    render(<FileUploader onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile('doc.pdf');
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it('displays the selected file name and size', () => {
    const onFilesChange = vi.fn();
    render(<FileUploader onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('report.pdf', 2048)] } });
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('shows a list of selected files with accessible label', () => {
    const onFilesChange = vi.fn();
    render(<FileUploader onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeFile('a.pdf'), makeFile('b.pdf')] },
    });
    expect(screen.getByRole('list', { name: 'Selected files' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  // ─── Remove file ─────────────────────────────────────────────────────────

  it('removes a file when its remove button is clicked', async () => {
    const user = userEvent.setup();
    const onFilesChange = vi.fn();
    render(<FileUploader onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('keep.pdf'), makeFile('remove.pdf')] } });

    await user.click(screen.getByRole('button', { name: 'Remove remove.pdf' }));
    expect(screen.queryByText('remove.pdf')).not.toBeInTheDocument();
    expect(screen.getByText('keep.pdf')).toBeInTheDocument();
    expect(onFilesChange).toHaveBeenLastCalledWith([expect.objectContaining({ name: 'keep.pdf' })]);
  });

  it('renders per-file remove buttons with accessible labels', () => {
    render(<FileUploader />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('doc.pdf')] } });
    expect(screen.getByRole('button', { name: 'Remove doc.pdf' })).toBeInTheDocument();
  });

  // ─── maxFiles truncation ─────────────────────────────────────────────────

  /*
   * It used to truncate to `maxFiles` and then validate the truncated list,
   * which made its own "up to N files" message unreachable: the extra files
   * were simply gone, with nothing said. Merging and validating are core's
   * and are now separate steps, so the selection is refused instead.
   */
  it('refuses a selection over maxFiles rather than dropping files from it', () => {
    const onFilesChange = vi.fn();
    render(<FileUploader maxFiles={2} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')] },
    });

    expect(onFilesChange).not.toHaveBeenCalled();
    expect(screen.getByText(/up to 2 files/i)).toBeInTheDocument();
  });

  it('accepts a selection up to the limit', () => {
    const onFilesChange = vi.fn();
    render(<FileUploader maxFiles={2} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.pdf'), makeFile('b.pdf')] } });

    expect(onFilesChange.mock.calls[0][0]).toHaveLength(2);
    expect(screen.queryByText(/up to 2 files/i)).not.toBeInTheDocument();
  });

  /*
   * A file input fires no `change` for an identical selection, so a rejected
   * value left in place meant picking the same file again did nothing and the
   * error stood with no way to retry.
   */
  it('clears the input after a rejected selection', () => {
    render(<FileUploader maxFiles={1} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.pdf'), makeFile('b.pdf')] } });

    expect(screen.getByText(/up to 1 file/i)).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  /*
   * The internal error id was in `aria-describedby` whether or not there was
   * an error to point at, so the dropzone described itself with an id that
   * resolved to nothing.
   */
  it('describes itself with the internal error only once there is one', () => {
    render(<FileUploader maxFiles={1} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });
    expect(dropzone).not.toHaveAttribute('aria-describedby');

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.pdf'), makeFile('b.pdf')] } });

    const describedBy = dropzone.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(/up to 1 file/i);
  });

  // ─── maxFileSize validation ───────────────────────────────────────────────

  it('shows an internal error when a file exceeds maxFileSize', () => {
    render(<FileUploader maxFileSize={500} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('big.pdf', 1024)] } });
    expect(screen.getByText(/exceeds the/i)).toBeInTheDocument();
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('disables the dropzone button and file input when disabled', () => {
    render(<FileUploader disabled />);
    expect(screen.getByRole('button', { name: /Upload files/i })).toBeDisabled();
    expect(document.querySelector('input[type="file"]')).toBeDisabled();
  });

  it('disables all remove buttons when disabled', () => {
    render(<FileUploader disabled value={[makeFile('doc.pdf')]} />);
    expect(screen.getByRole('button', { name: 'Remove doc.pdf' })).toBeDisabled();
  });

  // ─── Controlled value ────────────────────────────────────────────────────

  it('displays files from the controlled value prop', () => {
    render(<FileUploader value={[makeFile('controlled.pdf')]} onFilesChange={vi.fn()} />);
    expect(screen.getByText('controlled.pdf')).toBeInTheDocument();
  });
});

/*
 * `accept` filters the file picker and nothing else, so a drop used to get
 * past it entirely. Core's `fileMatchesAccept` is the check, shared with
 * `<pf-file-uploader>`.
 */
describe('FileUploader and accept', () => {
  const typedFile = (name: string, type: string) =>
    new File(['x'], name, { type, lastModified: 1 });

  it('refuses a dropped file of the wrong kind', () => {
    const onFilesChange = vi.fn();
    render(<FileUploader accept=".pdf" onFilesChange={onFilesChange} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [typedFile('a.exe', 'application/x-msdownload')] },
    });

    expect(onFilesChange).not.toHaveBeenCalled();
    expect(screen.getByText(/not an accepted file type/i)).toBeInTheDocument();
  });

  it('takes a dropped file of an accepted kind', () => {
    const onFilesChange = vi.fn();
    render(<FileUploader accept=".pdf,image/*" onFilesChange={onFilesChange} />);
    const dropzone = screen.getByRole('button', { name: /upload files/i });

    fireEvent.drop(dropzone, { dataTransfer: { files: [typedFile('shot.png', 'image/png')] } });

    expect(onFilesChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/not an accepted file type/i)).not.toBeInTheDocument();
  });
});
