import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressSteps, type ProgressStepItem } from './ProgressSteps';

const steps: ProgressStepItem[] = [
  { title: 'Account' },
  { title: 'Details' },
  { title: 'Confirm' },
];

describe('ProgressSteps', () => {
  it('renders all step titles', () => {
    render(<ProgressSteps steps={steps} />);
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders as an ordered list', () => {
    render(<ProgressSteps steps={steps} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders step descriptions when provided', () => {
    render(
      <ProgressSteps
        steps={[{ title: 'Step', description: 'Fill in your details.' }]}
      />,
    );
    expect(screen.getByText('Fill in your details.')).toBeInTheDocument();
  });

  // ─── Status inference ────────────────────────────────────────────────────

  it('marks the first step as current when no status is provided', () => {
    const { container } = render(<ProgressSteps steps={steps} />);
    const items = container.querySelectorAll('.pf-progress-steps__item');
    expect(items[0]).toHaveClass('pf-progress-steps__item--current');
  });

  it('marks remaining steps as upcoming when no status is provided', () => {
    const { container } = render(<ProgressSteps steps={steps} />);
    const items = container.querySelectorAll('.pf-progress-steps__item');
    expect(items[1]).toHaveClass('pf-progress-steps__item--upcoming');
    expect(items[2]).toHaveClass('pf-progress-steps__item--upcoming');
  });

  it('infers complete for steps before the current one', () => {
    const stepsWithCurrent: ProgressStepItem[] = [
      { title: 'Step 1' },
      { title: 'Step 2', status: 'current' },
      { title: 'Step 3' },
    ];
    const { container } = render(<ProgressSteps steps={stepsWithCurrent} />);
    const items = container.querySelectorAll('.pf-progress-steps__item');
    expect(items[0]).toHaveClass('pf-progress-steps__item--complete');
    expect(items[1]).toHaveClass('pf-progress-steps__item--current');
    expect(items[2]).toHaveClass('pf-progress-steps__item--upcoming');
  });

  it('respects explicit status on each step', () => {
    const explicit: ProgressStepItem[] = [
      { title: 'A', status: 'complete' },
      { title: 'B', status: 'complete' },
      { title: 'C', status: 'current' },
    ];
    const { container } = render(<ProgressSteps steps={explicit} />);
    const items = container.querySelectorAll('.pf-progress-steps__item');
    expect(items[0]).toHaveClass('pf-progress-steps__item--complete');
    expect(items[1]).toHaveClass('pf-progress-steps__item--complete');
    expect(items[2]).toHaveClass('pf-progress-steps__item--current');
  });

  // ─── Orientation ─────────────────────────────────────────────────────────

  it('defaults to horizontal orientation', () => {
    const { container } = render(<ProgressSteps steps={steps} />);
    expect(container.firstChild).toHaveClass('pf-progress-steps--horizontal');
  });

  it('applies vertical orientation class', () => {
    const { container } = render(
      <ProgressSteps steps={steps} orientation="vertical" />,
    );
    expect(container.firstChild).toHaveClass('pf-progress-steps--vertical');
  });
});
