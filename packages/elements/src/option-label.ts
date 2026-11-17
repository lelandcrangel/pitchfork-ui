/**
 * A `pf-option`'s label: its text without whatever sits in its `description`
 * slot.
 *
 * The closed field, typeahead and filtering all read the label. They used to
 * read `textContent`, so an option with supporting text showed it joined to
 * the label with no space in the closed field ("Classic RegularClassic"), and
 * typing a word from the description matched the option.
 */
export function optionLabel(option: Element): string {
  let text = '';
  for (const node of Array.from(option.childNodes)) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).getAttribute('slot') === 'description'
    ) {
      continue;
    }
    text += node.textContent ?? '';
  }
  return text.replace(/\s+/g, ' ').trim();
}
