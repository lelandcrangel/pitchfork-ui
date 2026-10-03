/**
 * The decisions behind a file picker: how a size is written, what makes two
 * selections the same file, which files a new selection leaves you with, and
 * what is wrong with the result.
 *
 * Shared because every one of them is text or a list a consumer can see, and
 * because the rules are easy to get subtly wrong in the same way twice.
 */

/** What a file picker needs to know about a file, and no more. */
export interface FileLike {
  name: string;
  size: number;
  lastModified?: number;
  /** The MIME type, which a dropped file has and a hand-made stand-in may not. */
  type?: string;
}

export interface FileSelectionLimits {
  /** The most files that may be held at once. */
  maxFiles?: number;
  /** The largest any one file may be, in bytes. */
  maxFileSize?: number;
  /** The `accept` list, in the same form an `<input type="file">` takes. */
  accept?: string;
}

/**
 * A size in the units a person reads.
 *
 * Binary steps with decimal names, which is what every file manager does.
 * `GB` is included because stopping at `MB` reads a 3 GB upload as
 * "3072.0 MB", and the whole point of the function is to be read.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

/**
 * What makes two selections the same file.
 *
 * Name, size and modification time together, because a browser gives no file
 * identity of its own: picking the same file twice produces two distinct
 * `File` objects, and a consumer who adds `report.pdf` from two folders is
 * adding two files. `lastModified` is optional only so a plain object can
 * stand in for a `File` in a test.
 */
export function fileKey(file: FileLike): string {
  return `${file.name}-${file.size}-${file.lastModified ?? 0}`;
}

/**
 * The files a new selection leaves you holding.
 *
 * Appends for a multiple picker and replaces for a single one, then drops
 * duplicates by `fileKey` keeping the **first** of each — so re-picking a
 * file already held is a no-op rather than a reordering.
 *
 * Deliberately does not truncate to `maxFiles`. The React `FileUploader`
 * truncated first and validated afterwards, which made its "You can upload up
 * to N files" message unreachable: the list was already short enough by the
 * time it was checked, so the extra files vanished with nothing said. Merging
 * and validating are separate so the caller can refuse a selection instead of
 * quietly losing part of it.
 */
export function mergeFileSelection<T extends FileLike>(
  existing: readonly T[],
  incoming: readonly T[],
  { multiple = true }: { multiple?: boolean } = {},
): T[] {
  if (!multiple) return incoming.slice(0, 1);

  const byKey = new Map<string, T>();
  for (const file of [...existing, ...incoming]) {
    const key = fileKey(file);
    if (!byKey.has(key)) byKey.set(key, file);
  }
  return [...byKey.values()];
}

/**
 * Whether a file is one of the kinds an `accept` list allows.
 *
 * The three forms a file input takes, and nothing else: an extension
 * (`.pdf`), a type (`image/png`) and a wildcard type (`image/*`). No list at
 * all allows everything.
 *
 * It exists because `accept` only filters the file *picker*. A **dropped**
 * file is never filtered by anything, so a dropzone that trusts the attribute
 * accepts whatever is dragged onto it — which is what both layers did.
 */
export function fileMatchesAccept(file: FileLike, accept?: string): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = (file.type ?? '').toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith('.')) return name.endsWith(token);
    if (token.endsWith('/*')) return type.startsWith(`${token.slice(0, -1)}`);
    return type === token;
  });
}

/**
 * What is wrong with a selection, as a sentence to show, or `null`.
 *
 * Each check names the offending file, because "one of these is wrong" is not
 * something a person can act on, and the kind is reported before the size
 * because it is the more specific complaint. `maxFileSize` and `maxFiles` are
 * honoured whenever they are finite and non-negative — the React version
 * tested them for truthiness, so a limit of `0`, which is a way of saying
 * "nothing may be uploaded", silently allowed everything.
 */
export function validateFileSelection(
  files: readonly FileLike[],
  { maxFiles, maxFileSize, accept }: FileSelectionLimits = {},
): string | null {
  if (accept) {
    const wrongKind = files.find((file) => !fileMatchesAccept(file, accept));
    if (wrongKind) return `"${wrongKind.name}" is not an accepted file type.`;
  }

  if (typeof maxFileSize === 'number' && maxFileSize >= 0) {
    const oversized = files.find((file) => file.size > maxFileSize);
    if (oversized) {
      return `"${oversized.name}" exceeds the ${formatFileSize(maxFileSize)} size limit.`;
    }
  }

  if (typeof maxFiles === 'number' && maxFiles >= 0 && files.length > maxFiles) {
    return `You can upload up to ${maxFiles} file${maxFiles === 1 ? '' : 's'}.`;
  }

  return null;
}

/**
 * The hint under a dropzone: what is accepted, how big, how many.
 *
 * In core rather than in each layer because it is the one place the three
 * limits are described to a person, and two layers describing them
 * differently is worse than either wording.
 */
export function fileLimitsHint(
  accept: string | undefined,
  { maxFiles, maxFileSize }: FileSelectionLimits = {},
): string {
  const parts: string[] = [];
  if (accept) parts.push(`Accepted: ${accept}`);
  if (typeof maxFileSize === 'number' && maxFileSize >= 0) {
    parts.push(`Max size: ${formatFileSize(maxFileSize)}`);
  }
  if (typeof maxFiles === 'number' && maxFiles >= 0) parts.push(`Max files: ${maxFiles}`);
  return parts.join(' | ');
}
