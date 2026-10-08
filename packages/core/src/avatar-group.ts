/**
 * How many faces a stacked avatar group shows, and what the `+N` chip says.
 *
 * Shared because the chip is arithmetic with an edge: a group told it has 40
 * people but handed 5 avatars has to count the 35 it was not given, and a
 * React `AvatarGroup` and a `<pf-avatar-group>` that disagreed about that
 * would report different team sizes for the same group.
 */

export interface AvatarGroupSplit {
  /** How many avatars to render. */
  shown: number;
  /** The number behind the `+N` chip; zero means no chip. */
  overflow: number;
  /** The group's size, which is what its accessible name counts. */
  total: number;
}

/**
 * Splits `count` avatars into the ones shown and the overflow.
 *
 * `total` is for a group that knows how many people there are without being
 * handed an avatar for each — "5 of 40" shows five faces and `+35`. Without
 * it the count is simply how many avatars there are.
 *
 * A negative or fractional `max` cannot produce a negative row: it floors at
 * zero, which shows the chip alone.
 */
export function splitAvatarGroup(count: number, max: number, total?: number): AvatarGroupSplit {
  const safeCount = Number.isFinite(count) ? Math.max(Math.floor(count), 0) : 0;
  const safeMax = Number.isFinite(max) ? Math.max(Math.floor(max), 0) : 0;
  const shown = Math.min(safeCount, safeMax);
  const resolvedTotal =
    total !== undefined && Number.isFinite(total) ? Math.max(Math.floor(total), 0) : safeCount;

  return { shown, overflow: Math.max(resolvedTotal - shown, 0), total: resolvedTotal };
}

/**
 * What an unnamed avatar group is called: "1 person", "4 people".
 *
 * Here rather than in either layer because it is the group's accessible name,
 * and a group that announced itself differently in the two layers would be a
 * different control to a screen reader.
 */
export function avatarGroupLabel(total: number): string {
  const safeTotal = Number.isFinite(total) ? Math.max(Math.floor(total), 0) : 0;
  return `${safeTotal} ${safeTotal === 1 ? 'person' : 'people'}`;
}
