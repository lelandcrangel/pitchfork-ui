import { PatternPreview, type Pattern } from './PatternPreview';

/**
 * The story body for a pattern, so the markup reaches the canvas and the
 * "Show code" panel from the same place.
 */
export function patternStory(pattern: Pattern) {
  return {
    render: () => <PatternPreview pattern={pattern} />,
    parameters: {
      docs: {
        source: {
          code: pattern.setup
            ? `${pattern.html}\n\n<script>\n  // Wiring, run against the markup above.\n  ${String(
                pattern.setup,
              )
                .split('\n')
                .join('\n  ')}\n</script>`
            : pattern.html,
        },
      },
    },
  };
}
