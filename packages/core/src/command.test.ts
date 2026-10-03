import { describe, expect, it } from 'vitest';
import { matchesCommandQuery, normalizeCommandQuery } from './command';

describe('normalizeCommandQuery', () => {
  it('trims and lower-cases', () => {
    expect(normalizeCommandQuery('  Open File  ')).toBe('open file');
  });

  it('reduces a whitespace-only query to nothing', () => {
    expect(normalizeCommandQuery('   ')).toBe('');
  });
});

describe('matchesCommandQuery', () => {
  const item = { label: 'Open file', description: 'Pick from recent', group: 'File' };

  it('matches everything on an empty or whitespace query', () => {
    expect(matchesCommandQuery(item, '')).toBe(true);
    expect(matchesCommandQuery(item, '   ')).toBe(true);
  });

  it('matches on the label', () => {
    expect(matchesCommandQuery(item, 'open')).toBe(true);
  });

  it('matches on the description', () => {
    expect(matchesCommandQuery(item, 'recent')).toBe(true);
  });

  /* So typing a section name narrows to that section. */
  it('matches on the group name', () => {
    expect(matchesCommandQuery(item, 'file')).toBe(true);
  });

  it('ignores case on both sides', () => {
    expect(matchesCommandQuery(item, 'OPEN')).toBe(true);
    expect(matchesCommandQuery({ label: 'OPEN FILE' }, 'open')).toBe(true);
  });

  it('matches a substring, not just a prefix', () => {
    expect(matchesCommandQuery(item, 'pen')).toBe(true);
  });

  it('does not match something absent from all three fields', () => {
    expect(matchesCommandQuery(item, 'zzz')).toBe(false);
  });

  it('tolerates missing and null fields', () => {
    expect(matchesCommandQuery({ label: 'Only a label' }, 'label')).toBe(true);
    expect(matchesCommandQuery({ label: null, description: null, group: null }, 'x')).toBe(false);
    expect(matchesCommandQuery({}, 'x')).toBe(false);
  });

  /* An item with nothing to search still shows on an empty query. */
  it('shows a field-less item when the query is empty', () => {
    expect(matchesCommandQuery({}, '')).toBe(true);
  });

  it('trims the query before matching, so a padded query still matches', () => {
    expect(matchesCommandQuery(item, '  open  ')).toBe(true);
  });
});
