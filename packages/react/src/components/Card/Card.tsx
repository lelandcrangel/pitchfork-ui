import { forwardRef } from 'react';

import { cx } from '../../utils/cx';
import './Card.css';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export type CardSectionProps = CardProps;

export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx('pf-card', className)} {...props} />
));
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-card__header', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-card__content', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-card__footer', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
