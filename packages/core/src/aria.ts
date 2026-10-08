export const composeDescribedBy = (...ids: Array<string | false | null | undefined>) =>
  ids.filter(Boolean).join(' ') || undefined;

/**
 * The four severities a live-region component reports at. Shared by Alert,
 * Notification and `<pf-notification>`, which must agree about how loudly each
 * one speaks.
 */
export type LiveRegionVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * The ARIA role a live region should carry for a given severity.
 *
 * `alert` is an assertive live region: it interrupts whatever a screen reader
 * is saying. That is right for a warning or a failure and wrong for a success
 * toast, which should wait its turn — so only `warning` and `danger` get it.
 *
 * Here rather than in either layer because the two had already diverged:
 * `Alert` carried this map and `Notification` carried no map at all, so the
 * same `danger` content announced assertively from one component and politely
 * from the other. One definition is what stops that happening again.
 */
export function liveRegionRole(variant: LiveRegionVariant): 'alert' | 'status' {
  return variant === 'warning' || variant === 'danger' ? 'alert' : 'status';
}
