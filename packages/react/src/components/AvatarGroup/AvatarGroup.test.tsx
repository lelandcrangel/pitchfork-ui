import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AvatarGroup, type AvatarGroupItem } from './AvatarGroup';

const people: AvatarGroupItem[] = [
  { name: 'Ada Lovelace' },
  { name: 'Grace Hopper' },
  { name: 'Alan Turing' },
  { name: 'Katherine Johnson' },
  { name: 'Edsger Dijkstra' },
  { name: 'Barbara Liskov' },
];

describe('AvatarGroup', () => {
  it('renders a group landmark with a default label', () => {
    render(<AvatarGroup avatars={people.slice(0, 3)} />);
    expect(screen.getByRole('group', { name: '3 people' })).toBeInTheDocument();
  });

  it('uses a custom label when provided', () => {
    render(<AvatarGroup avatars={people.slice(0, 3)} label="Project team" />);
    expect(screen.getByRole('group', { name: 'Project team' })).toBeInTheDocument();
  });

  it('shows all avatars when under the max', () => {
    render(<AvatarGroup avatars={people.slice(0, 3)} max={5} />);
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Alan Turing' })).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('collapses extras into a +N overflow chip', () => {
    render(<AvatarGroup avatars={people} max={3} />);
    // 6 people, max 3 → +3
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '3 more' })).toBeInTheDocument();
  });

  it('computes overflow from an explicit total', () => {
    render(<AvatarGroup avatars={people.slice(0, 3)} max={3} total={20} />);
    expect(screen.getByText('+17')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '20 people' })).toBeInTheDocument();
  });

  it('applies the size class', () => {
    const { container } = render(<AvatarGroup avatars={people.slice(0, 2)} size="lg" />);
    expect(container.firstChild).toHaveClass('pf-avatar-group--lg');
  });

  it('singular label for one person', () => {
    render(<AvatarGroup avatars={people.slice(0, 1)} />);
    expect(screen.getByRole('group', { name: '1 person' })).toBeInTheDocument();
  });

  it('forwards extra props to the root element', () => {
    render(<AvatarGroup avatars={people.slice(0, 2)} data-testid="group" />);
    expect(screen.getByTestId('group')).toBeInTheDocument();
  });
});
