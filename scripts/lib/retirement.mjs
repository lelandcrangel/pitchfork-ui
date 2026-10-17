/**
 * The one place the retirement window is written down.
 *
 * It is quoted in five surfaces a consumer actually reads -- the npm
 * deprecation notice, `llms.txt`, `llms-full.txt`, the generated migration
 * guide, and the two hand-written docs pages -- and four of them used to call
 * it "a stated window" without stating it anywhere on the site. The date
 * existed only in `deprecate-react.mjs`, where it reached npm and nothing else.
 *
 * The three generators import this. The two MDX pages cannot, so
 * `check-doc-claims.mjs` asserts they carry this exact string and that nothing
 * is still promising a window it does not name.
 */
export const WINDOW_ENDS = '30 April 2027';
