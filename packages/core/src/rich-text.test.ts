import { describe, expect, it } from 'vitest';
import { RICH_TEXT_COMMANDS, stripOuterParagraph } from './rich-text';

describe('RICH_TEXT_COMMANDS', () => {
  it('offers the six commands in order', () => {
    expect(RICH_TEXT_COMMANDS.map((item) => item.command)).toEqual([
      'bold',
      'italic',
      'underline',
      'insertUnorderedList',
      'insertOrderedList',
      'removeFormat',
    ]);
  });

  it('names every one of them', () => {
    expect(RICH_TEXT_COMMANDS.every((item) => item.label && item.text)).toBe(true);
  });

  it('draws one separator, before the lists', () => {
    const separators = RICH_TEXT_COMMANDS.filter((item) => item.separatorBefore);
    expect(separators.map((item) => item.command)).toEqual(['insertUnorderedList']);
  });
});

describe('stripOuterParagraph', () => {
  it('drops a single wrapping paragraph', () => {
    expect(stripOuterParagraph('<p>hello</p>')).toBe('hello');
    expect(stripOuterParagraph('  <p>hello</p>  ')).toBe('hello');
  });

  it('keeps nested markup inside it', () => {
    expect(stripOuterParagraph('<p>a <strong>b</strong> c</p>')).toBe('a <strong>b</strong> c');
  });

  /*
   * The defect this function exists to not have. Every one of the React
   * version's four conditions is true of two paragraphs, which it cut into
   * the broken fragment `a</p><p>b`.
   */
  it('leaves two paragraphs alone', () => {
    expect(stripOuterParagraph('<p>a</p><p>b</p>')).toBe('<p>a</p><p>b</p>');
    expect(stripOuterParagraph('<p>a</p>\n<p>b</p>')).toBe('<p>a</p>\n<p>b</p>');
  });

  it('leaves anything that is not one paragraph alone', () => {
    expect(stripOuterParagraph('hello')).toBe('hello');
    expect(stripOuterParagraph('<div>hello</div>')).toBe('<div>hello</div>');
    expect(stripOuterParagraph('<p>a</p> trailing')).toBe('<p>a</p> trailing');
    expect(stripOuterParagraph('leading <p>a</p>')).toBe('leading <p>a</p>');
  });

  it('is empty for nothing', () => {
    expect(stripOuterParagraph('')).toBe('');
    expect(stripOuterParagraph('<p></p>')).toBe('');
  });
});
