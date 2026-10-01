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
