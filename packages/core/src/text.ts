/**
 * Derive avatar initials from a person's name.
 *
 * Shared because both layers must produce the same letters for the same name:
 * a React Avatar and a <pf-avatar> showing different fallbacks for "Ada
 * Lovelace" would be a visible inconsistency in the same design system.
 */
export function getAvatarInitials(name?: string): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '?';

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

/**
 * Render a key combination as one string — `['⌘', 'K']` becomes `⌘ + K`.
 *
 * Deliberately one string rather than an element per key: it keeps a single
 * contrast-resolvable element and avoids symbol-only child nodes that axe
 * cannot evaluate.
 */
export function formatKeyCombination(keys: string[], separator = '+'): string {
  return keys.join(` ${separator} `);
}

/**
 * Group a card number into blocks of four — `4111111111111111` becomes
 * `4111 1111 1111 1111`. Non-digits in the input are discarded first, so a
 * value that already carries spaces or dashes regroups cleanly.
 */
export function formatCardNumber(value: string): string {
  return value
    .replace(/\D+/g, '')
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/**
 * Group a card number into blocks of four with everything but the last four
 * digits replaced by asterisks.
 *
 * Four digits or fewer are returned as the bare digits: there is nothing to
 * hide behind, and starring all of them would leave a field that says only
 * what length it was.
 *
 * Shared with `formatCardNumber` because a React `CreditCard` and a
 * `<pf-credit-card>` showing the same number grouped differently would be a
 * visible inconsistency in one design system.
 */
export function maskCardNumber(value: string): string {
  const digits = value.replace(/\D+/g, '');
  if (digits.length <= 4) return digits;

  const masked = `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
  return masked.replace(/(.{4})/g, '$1 ').trim();
}
