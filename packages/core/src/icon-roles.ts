import type { BundledFaIconName, CustomGlyphName } from './custom-glyphs';

/**
 * The icons the components draw for themselves, named by what they are for.
 *
 * A component used to ask for a Font Awesome name: every close button asked
 * for `circle-xmark`, the calendars for `square-caret-left`. That made the
 * library's own UI a Font Awesome dependency in all but name — a consumer on
 * Lucide had to register Lucide's `X` under the name `circle-xmark` to change
 * a close button, and register it a second time under `circle-xmark` again
 * for the danger alert, which happens to share the glyph.
 *
 * So the components ask for a role, and each role names the glyph it draws by
 * default. A role resolves as **whatever is registered under the role's own
 * name, else whatever its default name resolves to** — so registering `close`
 * changes every close button and nothing else, while registering
 * `circle-xmark` still changes both close and danger, exactly as it did.
 *
 * A role is never resolved through a Font Awesome alias. Font Awesome's
 * `xmark` lists `remove` among its former names and `plus` lists `add`, so a
 * consumer registering `faXmark` would otherwise turn the number input's
 * decrement into a cross. That is also why the decrement role is `subtract`
 * rather than `remove`.
 *
 * Every default is a built-in glyph or one both layers bundle — `satisfies`
 * makes that a compile error rather than a component asking for a glyph
 * nobody drew, and core's tests assert it at run time as well.
 */
export const ICON_ROLES = {
  /** Dismiss, clear or remove: alerts, tags, modals, a picker's clear button. */
  close: 'circle-xmark',
  /** Opens a list or a section. Rotated by the components' CSS, so it must point down. */
  'chevron-down': 'chevron-down',
  /** Back one page, month or slide. */
  previous: 'square-caret-left',
  /** Forward one page, month or slide. */
  next: 'square-caret-right',
  search: 'magnifying-glass',
  /** Increment. */
  add: 'plus',
  /** Decrement. */
  subtract: 'minus',
  info: 'circle-info',
  /** Also "copied" on a copy button. */
  success: 'circle-check',
  /** Also a copy that failed. */
  warning: 'triangle-exclamation',
  danger: 'circle-xmark',
  help: 'circle-question',
  calendar: 'calendar',
  clock: 'clock',
  upload: 'file-arrow-up',
  copy: 'copy',
  star: 'star',
  /** More options. */
  more: 'ellipsis',
} as const satisfies Record<string, CustomGlyphName | BundledFaIconName>;

/** A name a component asks for by purpose rather than by glyph. */
export type IconRole = keyof typeof ICON_ROLES;

/** The roles, sorted. */
export const getIconRoles = () => (Object.keys(ICON_ROLES) as IconRole[]).sort();

export const isIconRole = (name: string): name is IconRole =>
  Object.prototype.hasOwnProperty.call(ICON_ROLES, name);
