import { cx } from '../../utils/cx';
import './ProgressSteps.css';

export type ProgressStepStatus = 'complete' | 'current' | 'upcoming';

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

function inferStatus(
  index: number,
  steps: ProgressStepItem[],
): ProgressStepStatus {
  const firstCurrent = steps.findIndex((step) => step.status === 'current');

  if (steps[index]?.status) {
    return steps[index].status as ProgressStepStatus;
  }

  if (firstCurrent === -1) {
    return index === 0 ? 'current' : 'upcoming';
  }

  if (index < firstCurrent) {
    return 'complete';
  }

  return index === firstCurrent ? 'current' : 'upcoming';
}

export function ProgressSteps({
  className,
  steps,
  orientation = 'horizontal',
  ...props
}: ProgressStepsProps) {
  return (
    <ol
      className={cx(
        'pf-progress-steps',
        `pf-progress-steps--${orientation}`,
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const status = inferStatus(index, steps);

        return (
          <li
            key={step.id ?? `step-${index}`}
            className={cx(
              'pf-progress-steps__item',
              `pf-progress-steps__item--${status}`,
            )}
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
                <p className="pf-progress-steps__description">
                  {step.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

ProgressSteps.displayName = 'ProgressSteps';
