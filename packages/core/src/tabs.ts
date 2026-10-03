/**
 * Which tab in a tablist is the shown one.
 *
 * Shared because the fallback is a rule, not an implementation detail: a tab
 * set asked for a value it does not have — or one belonging to a disabled tab
 * — still has to show *something*, and a React `Tabs` and a `<pf-tabs>` that
 * disagreed about which tab that is would be two components wearing one name.
 */

/** The parts of a tab this resolution needs. */
export interface TabLike {
  value: string;
  disabled?: boolean;
}

/**
 * The tab a given value selects: the enabled tab carrying it, or the first
 * enabled tab when no such tab exists.
 *
 * That fallback covers three cases with one rule — no value asked for at all,
 * a value no tab carries, and a value belonging to a disabled tab — because a
 * tablist with nothing selected shows no panel, which reads as broken. It
 * returns `undefined` only when every tab is disabled or there are none, which
 * are the two cases where there is genuinely nothing to show.
 */
export function resolveSelectedTab<T extends TabLike>(tabs: T[], value?: string): T | undefined {
  return (
    tabs.find((tab) => tab.value === value && !tab.disabled) ?? tabs.find((tab) => !tab.disabled)
  );
}
