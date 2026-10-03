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
