/**
 * What counts as a match when filtering a command palette.
 *
 * Shared because it is a semantic contract rather than a convenience: the
 * React component searches a label, a description and a group name, and
 * `pf-command-palette` has to search the same three or the two layers answer
 * the same keystroke differently. That is the kind of divergence each layer's
 * own tests happily agree with.
 */
export interface CommandSearchFields {
  label?: string | null;
  description?: string | null;
  group?: string | null;
}

/** Trimmed and lower-cased, so an empty or whitespace query matches everything. */
export function normalizeCommandQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Substring, case-insensitive, across all three fields. Not fuzzy: the React
 * component is a plain `includes`, and a fuzzy matcher here would make the
 * elements layer rank results the React one does not.
 */
export function matchesCommandQuery(fields: CommandSearchFields, query: string): boolean {
  const needle = normalizeCommandQuery(query);
  if (!needle) return true;

  return [fields.label, fields.description, fields.group].some((field) =>
    field ? field.toLowerCase().includes(needle) : false,
  );
}

/**
 * Whether a combobox query should filter the list at all.
 *
 * It should not when the query is simply the chosen option's label echoed
 * back, which is what the field holds the moment after a selection. Filtering
 * then would leave exactly one option on screen, so reopening the list to
 * change your mind would show only the answer you already had.
 *
 * Shared because it is a rule rather than a rendering detail, and a layer that
 * forgot it would feel broken in a way its own tests would not notice.
 */
export function queryIsEchoedSelection(
  query: string,
  selectedLabel: string | null | undefined,
): boolean {
  if (!selectedLabel) return false;
  return query.trim() === selectedLabel.trim();
}
