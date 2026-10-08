/**
 * Which step of a progress indicator is done, which is being worked on, and
 * which are still ahead.
 *
 * Shared because the inference is a rule rather than a rendering detail: a
 * consumer who marks one step `current` and leaves the rest alone expects the
 * earlier ones to read as complete, and a React `ProgressSteps` and a
 * `<pf-progress-steps>` that disagreed about that would be two components
 * wearing one name.
 */

export type StepStatus = 'complete' | 'current' | 'upcoming';

/** The part of a step this inference needs. */
export interface StepLike {
  status?: StepStatus;
}

/**
 * A status for every step, in order.
 *
 * An explicit status always wins, so a trail can mark several steps complete
 * out of order if it really wants to. Everything else follows from the first
 * step marked `current`: before it is complete, after it is upcoming. With
 * nothing marked at all the first step is the current one, because a progress
 * indicator showing no progress at all reads as broken.
 *
 * The whole array rather than one step's answer, so the scan for that first
 * `current` happens once instead of once per step.
 */
export function resolveStepStatuses(steps: readonly StepLike[]): StepStatus[] {
  const firstCurrent = steps.findIndex((step) => step.status === 'current');

  return steps.map((step, index) => {
    if (step.status) return step.status;
    if (firstCurrent === -1) return index === 0 ? 'current' : 'upcoming';
    return index < firstCurrent ? 'complete' : 'upcoming';
  });
}
