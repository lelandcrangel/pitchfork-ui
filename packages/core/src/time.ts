/**
 * Time-of-day maths, shared by `TimePicker` and `<pf-time-picker>`.
 *
 * The canonical value is always 24-hour `HH:mm`, whatever the display does —
 * a 12-hour picker is a *rendering* choice, and a component whose submitted
 * value changed with its display would be unusable on a server.
 */

export type HourCycle = 12 | 24;
export type Meridiem = 'AM' | 'PM';

export interface TimeParts {
  /** 0–23, or null when there is no value. */
  hour: number | null;
  /** 0–59, or null when there is no value. */
  minute: number | null;
}

/**
 * Two digits, which both layers need for the column labels as well as for the
 * canonical value — so it is exported rather than private.
 */
export const padTimePart = (value: number): string => String(value).padStart(2, '0');

/**
 * Parses `HH:mm` (or `H:mm`) into hour and minute, or nulls.
 *
 * Out-of-range parts are rejected rather than wrapped: `25:00` is not 1am, it
 * is a mistake, and silently turning it into one hides the mistake.
 */
export function parseTimeValue(value: string | null | undefined): TimeParts {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? '').trim());
  if (!match) return { hour: null, minute: null };

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { hour: null, minute: null };

  return { hour, minute };
}

/** The canonical 24-hour `HH:mm`, or `''` when either part is missing. */
export function formatTimeValue(parts: TimeParts): string {
  if (parts.hour === null || parts.minute === null) return '';
  return `${padTimePart(parts.hour)}:${padTimePart(parts.minute)}`;
}

/** What the trigger shows: `14:30`, or `2:30 PM` on a 12-hour cycle. */
export function formatTimeDisplay(parts: TimeParts, hourCycle: HourCycle): string {
  if (parts.hour === null || parts.minute === null) return '';
  if (hourCycle === 24) return `${padTimePart(parts.hour)}:${padTimePart(parts.minute)}`;

  return `${toHour12(parts.hour)}:${padTimePart(parts.minute)} ${meridiemOf(parts.hour)}`;
}

/** Which half of the day an hour falls in. */
export function meridiemOf(hour24: number): Meridiem {
  return hour24 < 12 ? 'AM' : 'PM';
}

/**
 * The 12-hour face of a 24-hour hour: midnight and midday both read as 12,
 * not 0, which is the one case `hour % 12` gets wrong.
 */
export function toHour12(hour24: number): number {
  const face = hour24 % 12;
  return face === 0 ? 12 : face;
}

/** The 24-hour hour for a clock face plus a meridiem. 12 AM is 0, 12 PM is 12. */
export function toHour24(hour12: number, meridiem: Meridiem): number {
  const base = hour12 % 12;
  return meridiem === 'PM' ? base + 12 : base;
}

/**
 * The options a column offers: `0, step, 2*step, …` below `length`.
 *
 * A step that does not divide the range leaves a short last stride rather
 * than overshooting — `timeRange(60, 25)` is `[0, 25, 50]`, and 50 is a real
 * minute where 75 is not.
 */
export function timeRange(length: number, step = 1): number[] {
  const safeStep = Math.max(1, Math.floor(step));
  const count = Math.ceil(length / safeStep);
  return Array.from({ length: count }, (_, index) => index * safeStep);
}

/** The hours a column offers: 0–23, or the 1–12 clock face. */
export function hourOptions(hourCycle: HourCycle): number[] {
  return hourCycle === 24 ? timeRange(24) : timeRange(12).map((hour) => hour + 1);
}
