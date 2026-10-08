import { describe, expect, it } from 'vitest';
import {
  fileKey,
  fileLimitsHint,
  fileMatchesAccept,
  formatFileSize,
  mergeFileSelection,
  validateFileSelection,
} from './files';

const file = (name: string, size: number, lastModified = 1) => ({ name, size, lastModified });

describe('formatFileSize', () => {
  it('writes bytes, kilobytes and megabytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  /* Stopping at MB reads a 3 GB upload as "3072.0 MB". */
  it('goes on to gigabytes', () => {
    expect(formatFileSize(3 * 1024 ** 3)).toBe('3.0 GB');
  });

  it('is harmless for a size that is not one', () => {
    expect(formatFileSize(Number.NaN)).toBe('0 B');
    expect(formatFileSize(-10)).toBe('0 B');
  });
});

describe('fileKey', () => {
  it('tells two different files apart', () => {
    expect(fileKey(file('a.pdf', 10))).not.toBe(fileKey(file('b.pdf', 10)));
    expect(fileKey(file('a.pdf', 10))).not.toBe(fileKey(file('a.pdf', 20)));
    expect(fileKey(file('a.pdf', 10, 1))).not.toBe(fileKey(file('a.pdf', 10, 2)));
  });

  it('treats the same file picked twice as one', () => {
    expect(fileKey(file('a.pdf', 10))).toBe(fileKey(file('a.pdf', 10)));
  });

  it('stands in for a missing modification time', () => {
    expect(fileKey({ name: 'a.pdf', size: 10 })).toBe('a.pdf-10-0');
  });
});

describe('mergeFileSelection', () => {
  it('appends to what is already held', () => {
    const next = mergeFileSelection([file('a.pdf', 1)], [file('b.pdf', 2)]);
    expect(next.map((f) => f.name)).toEqual(['a.pdf', 'b.pdf']);
  });

  it('replaces for a single picker', () => {
    const next = mergeFileSelection([file('a.pdf', 1)], [file('b.pdf', 2), file('c.pdf', 3)], {
      multiple: false,
    });
    expect(next.map((f) => f.name)).toEqual(['b.pdf']);
  });

  /* Re-picking a held file is a no-op, not a reordering. */
  it('keeps the first of each duplicate', () => {
    const held = file('a.pdf', 1);
    const next = mergeFileSelection([held, file('b.pdf', 2)], [file('a.pdf', 1)]);
    expect(next.map((f) => f.name)).toEqual(['a.pdf', 'b.pdf']);
    expect(next[0]).toBe(held);
  });

  /*
   * No truncation here: truncating before validating is what made the React
   * uploader's own "up to N files" message unreachable.
   */
  it('does not truncate to a limit it was not given', () => {
    const next = mergeFileSelection([], [file('a.pdf', 1), file('b.pdf', 2), file('c.pdf', 3)]);
    expect(next).toHaveLength(3);
  });
});

describe('validateFileSelection', () => {
  it('passes a selection inside the limits', () => {
    expect(
      validateFileSelection([file('a.pdf', 10)], { maxFiles: 2, maxFileSize: 100 }),
    ).toBeNull();
  });

  it('names the file that is too big', () => {
    expect(
      validateFileSelection([file('a.pdf', 10), file('big.pdf', 2048)], { maxFileSize: 1024 }),
    ).toBe('"big.pdf" exceeds the 1.0 KB size limit.');
  });

  it('reports too many files', () => {
    expect(validateFileSelection([file('a.pdf', 1), file('b.pdf', 1)], { maxFiles: 1 })).toBe(
      'You can upload up to 1 file.',
    );
    expect(
      validateFileSelection([file('a.pdf', 1), file('b.pdf', 1), file('c.pdf', 1)], {
        maxFiles: 2,
      }),
    ).toBe('You can upload up to 2 files.');
  });

  it('reports the size before the count, which is the one a person can act on', () => {
    expect(
      validateFileSelection([file('big.pdf', 2048), file('b.pdf', 1)], {
        maxFiles: 1,
        maxFileSize: 1024,
      }),
    ).toContain('big.pdf');
  });

  /* A limit of zero is a way of saying "nothing may be uploaded". */
  it('honours a limit of zero', () => {
    expect(validateFileSelection([file('a.pdf', 1)], { maxFiles: 0 })).toBe(
      'You can upload up to 0 files.',
    );
    expect(validateFileSelection([file('a.pdf', 1)], { maxFileSize: 0 })).toBe(
      '"a.pdf" exceeds the 0 B size limit.',
    );
  });

  it('checks nothing it was not asked to', () => {
    expect(validateFileSelection([file('a.pdf', 10 ** 9)])).toBeNull();
  });
});

describe('fileLimitsHint', () => {
  it('describes each limit it was given', () => {
    expect(fileLimitsHint('.pdf', { maxFileSize: 1024, maxFiles: 3 })).toBe(
      'Accepted: .pdf | Max size: 1.0 KB | Max files: 3',
    );
  });

  it('describes only what it was given', () => {
    expect(fileLimitsHint(undefined, { maxFiles: 2 })).toBe('Max files: 2');
    expect(fileLimitsHint('.png')).toBe('Accepted: .png');
    expect(fileLimitsHint(undefined)).toBe('');
  });
});

/*
 * `accept` filters the file *picker* and nothing else. A dropped file passes
 * no filter at all, so the check has to be the uploader's own.
 */
describe('fileMatchesAccept', () => {
  const pdf = { name: 'report.pdf', size: 1, type: 'application/pdf' };
  const png = { name: 'shot.PNG', size: 1, type: 'image/png' };

  it('allows everything with no list', () => {
    expect(fileMatchesAccept(pdf)).toBe(true);
    expect(fileMatchesAccept(pdf, '')).toBe(true);
    expect(fileMatchesAccept(pdf, '  ,  ')).toBe(true);
  });

  it('matches an extension, ignoring case', () => {
    expect(fileMatchesAccept(pdf, '.pdf')).toBe(true);
    expect(fileMatchesAccept(png, '.png')).toBe(true);
    expect(fileMatchesAccept(pdf, '.png')).toBe(false);
  });

  it('matches an exact type', () => {
    expect(fileMatchesAccept(pdf, 'application/pdf')).toBe(true);
    expect(fileMatchesAccept(pdf, 'image/png')).toBe(false);
  });

  it('matches a wildcard type', () => {
    expect(fileMatchesAccept(png, 'image/*')).toBe(true);
    expect(fileMatchesAccept(pdf, 'image/*')).toBe(false);
  });

  it('takes any of a list', () => {
    expect(fileMatchesAccept(pdf, 'image/*, .pdf')).toBe(true);
    expect(fileMatchesAccept(png, 'image/*, .pdf')).toBe(true);
    expect(fileMatchesAccept({ name: 'a.txt', size: 1, type: 'text/plain' }, 'image/*,.pdf')).toBe(
      false,
    );
  });

  /* A file with no type is judged on its name alone. */
  it('falls back to the name when there is no type', () => {
    expect(fileMatchesAccept({ name: 'a.pdf', size: 1 }, '.pdf')).toBe(true);
    expect(fileMatchesAccept({ name: 'a.pdf', size: 1 }, 'application/pdf')).toBe(false);
  });
});

describe('validateFileSelection with accept', () => {
  it('names the file of the wrong kind', () => {
    expect(
      validateFileSelection([{ name: 'a.exe', size: 1, type: 'application/octet-stream' }], {
        accept: '.pdf',
      }),
    ).toBe('"a.exe" is not an accepted file type.');
  });

  it('reports the kind before the size, which is the more specific complaint', () => {
    expect(
      validateFileSelection([{ name: 'a.exe', size: 9999, type: 'application/octet-stream' }], {
        accept: '.pdf',
        maxFileSize: 10,
      }),
    ).toContain('not an accepted file type');
  });

  it('passes a file of an accepted kind', () => {
    expect(
      validateFileSelection([{ name: 'a.pdf', size: 1, type: 'application/pdf' }], {
        accept: '.pdf,.docx',
      }),
    ).toBeNull();
  });
});
