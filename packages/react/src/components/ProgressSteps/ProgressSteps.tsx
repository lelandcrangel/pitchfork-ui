import { resolveStepStatuses, type StepStatus } from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './ProgressSteps.css';

export type ProgressStepStatus = StepStatus;

export interface ProgressStepItem {
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: ProgressStepStatus;
  id?: string;
}

export interface ProgressStepsProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: ProgressStepItem[];
  orientation?: 'horizontal' | 'vertical';
}

export const ProgressSteps = forwardRef<HTMLOListElement, ProgressStepsProps>(
  function ProgressSteps({ className, steps, orientation = 'horizontal', ...props }, ref) {
    /*
     * The inference is core's, so `<pf-progress-steps>` reads the same trail
     * the same way — an explicit status wins, and everything before the first
     * `current` is complete. One scan for the whole trail rather than one per
     * step, which is what the per-index version did.
     */
    const statuses = resolveStepStatuses(steps);

    return (
      <ol
        ref={ref}
        className={cx('pf-progress-steps', `pf-progress-steps--${orientation}`, className)}
        {...props}
      >
        {steps.map((step, index) => {
          const status = statuses[index];

          return (
            <li
              key={step.id ?? `step-${index}`}
              className={cx('pf-progress-steps__item', `pf-progress-steps__item--${status}`)}
              // What says which step the user is on: the marker is
              // `aria-hidden` and the statuses are colour, so nothing else
              // in the accessibility tree does.
              aria-current={status === 'current' ? 'step' : undefined}
            >
              <div className="pf-progress-steps__marker-wrap" aria-hidden>
                <span className="pf-progress-steps__marker">{index + 1}</span>
                {index < steps.length - 1 ? (
                  <span className="pf-progress-steps__connector" />
                ) : null}
              </div>

              <div className="pf-progress-steps__content">
                <p className="pf-progress-steps__title">{step.title}</p>
                {step.description ? (
                  <p className="pf-progress-steps__description">{step.description}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  },
);

ProgressSteps.displayName = 'ProgressSteps';
