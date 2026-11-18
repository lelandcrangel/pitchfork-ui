/**
 * Whether two lists of flat records hold the same values, field for field.
 *
 * For a chart's `@State` list, which the chart rebuilds whenever it reads its
 * children: Stencil re-renders on any new array, equal or not, and a chart
 * reads its children three times as it loads -- before first paint, once
 * loaded, and on the first `slotchange`. Assigning only a changed list is what
 * keeps that to one render. `pf-line-chart`, `pf-bar-chart` and
 * `pf-radar-chart` each rendered twice on load; `pf-pie-chart` already
 * rendered once, because its state is strings.
 */
export function sameRecords<T extends object>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((record, index) => {
    const other = b[index] as Record<string, unknown>;
    const entries = Object.entries(record);
    return (
      entries.length === Object.keys(other).length &&
      entries.every(([key, value]) => Object.is(value, other[key]))
    );
  });
}
