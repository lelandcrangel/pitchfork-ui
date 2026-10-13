/**
 * These moved to @pitchfork-ui/core so that non-React renderers can use them.
 * Re-exported here because they are part of this package's public API.
 *
 * Each one is **re-declared** rather than re-exported, so the `@deprecated`
 * sits on a declaration this package owns. A tag on an export specifier is
 * honoured when the file is opened directly and is lost when the same file is
 * reached through the package specifier — measured both ways on this very
 * `dist/index.d.ts`, which reported `own=[deprecated]` as a path and `own=[]`
 * as `@pitchfork-ui/react`. A consumer only ever sees the second, so the
 * specifier form deprecated nothing for the one audience it exists for.
 *
 * The bindings are the same values, so `Keys === core.Keys` still holds; what
 * is deprecated is reaching them through this package rather than through
 * `@pitchfork-ui/core`, where they live and are not deprecated at all.
 */
import {
  composeDescribedBy as coreComposeDescribedBy,
  getFocusableElements as coreGetFocusableElements,
  isActivationKey as coreIsActivationKey,
  Keys as coreKeys,
} from '@pitchfork-ui/core';

/** @deprecated `@pitchfork-ui/react` is deprecated. Import `composeDescribedBy` from `@pitchfork-ui/core`, where it lives and is not deprecated. */
export const composeDescribedBy = coreComposeDescribedBy;

/** @deprecated `@pitchfork-ui/react` is deprecated. Import `getFocusableElements` from `@pitchfork-ui/core`, where it lives and is not deprecated. */
export const getFocusableElements = coreGetFocusableElements;

/** @deprecated `@pitchfork-ui/react` is deprecated. Import `isActivationKey` from `@pitchfork-ui/core`, where it lives and is not deprecated. */
export const isActivationKey = coreIsActivationKey;

/** @deprecated `@pitchfork-ui/react` is deprecated. Import `Keys` from `@pitchfork-ui/core`, where it lives and is not deprecated. */
export const Keys = coreKeys;
