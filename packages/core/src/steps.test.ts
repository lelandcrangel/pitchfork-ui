import { describe, expect, it } from 'vitest';
import { resolveStepStatuses } from './steps';

describe('resolveStepStatuses', () => {
  it('starts on the first step when nothing is marked', () => {
    expect(resolveStepStatuses([{}, {}, {}])).toEqual(['current', 'upcoming', 'upcoming']);
  });

  it('completes everything before the step marked current', () => {
    expect(resolveStepStatuses([{}, { status: 'current' }, {}])).toEqual([
      'complete',
      'current',
      'upcoming',
    ]);
  });

  it('takes the first of several marked current', () => {
    expect(resolveStepStatuses([{}, { status: 'current' }, {}, { status: 'current' }])).toEqual([
      'complete',
      'current',
      'upcoming',
      'current',
    ]);
  });

  /* An explicit status always wins, however unusual the trail it describes. */
  it('respects a status on every step', () => {
    expect(
      resolveStepStatuses([{ status: 'complete' }, { status: 'upcoming' }, { status: 'current' }]),
    ).toEqual(['complete', 'upcoming', 'current']);
  });

  it('leaves a step after the current one upcoming even if earlier ones are marked', () => {
    expect(resolveStepStatuses([{ status: 'complete' }, { status: 'current' }, {}])).toEqual([
      'complete',
      'current',
      'upcoming',
    ]);
  });

  it('has nothing to say about an empty trail', () => {
    expect(resolveStepStatuses([])).toEqual([]);
  });

  it('makes a trail of one the current step', () => {
    expect(resolveStepStatuses([{}])).toEqual(['current']);
  });
});
