import { forwardRef } from 'react';

import { cx } from '../../utils/cx';
import './Card.css';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-card>`, or `PfCard` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-card>`, or `PfCard` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type CardSectionProps = CardProps;

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-card>`, or `PfCard` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cx('pf-card', className)} {...props} />
));
Card.displayName = 'Card';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-card-header>`, or `PfCardHeader` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-card__header', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-card-content>`, or `PfCardContent` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-card__content', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-card-footer>`, or `PfCardFooter` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-card__footer', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
