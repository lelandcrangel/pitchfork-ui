import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Card, CardContent, CardFooter, CardHeader } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card body</Card>);
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('applies the pf-card class', () => {
    const { container } = render(<Card />);
    expect(container.firstChild).toHaveClass('pf-card');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('applies the pf-card__header class', () => {
    const { container } = render(<CardHeader />);
    expect(container.firstChild).toHaveClass('pf-card__header');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Main content</CardContent>);
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('applies the pf-card__content class', () => {
    const { container } = render(<CardContent />);
    expect(container.firstChild).toHaveClass('pf-card__content');
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies the pf-card__footer class', () => {
    const { container } = render(<CardFooter />);
    expect(container.firstChild).toHaveClass('pf-card__footer');
  });
});

describe('Card composition', () => {
  it('renders all sections together', () => {
    render(
      <Card>
        <CardHeader>Title</CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Actions</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
