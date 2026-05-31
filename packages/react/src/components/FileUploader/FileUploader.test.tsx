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

  it('silently truncates to maxFiles when more files are selected', () => {
    const onFilesChange = vi.fn();
    render(<FileUploader maxFiles={2} onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')] },
    });
    // Only the first 2 files are kept; no error shown
    expect(onFilesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'a.pdf' }),
        expect.objectContaining({ name: 'b.pdf' }),
      ]),
    );
    expect(onFilesChange.mock.calls[0][0]).toHaveLength(2);
    expect(screen.queryByText(/up to 2 files/i)).not.toBeInTheDocument();
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
