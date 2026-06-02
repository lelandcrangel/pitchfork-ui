import { cx } from '../../utils/cx';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export type CardSectionProps = CardProps;

export function Card({ className, ref, ...props }: CardProps) {
  return <div ref={ref} className={cx('pf-card', className)} {...props} />;
}
Card.displayName = 'Card';

export function CardHeader({ className, ref, ...props }: CardSectionProps) {
  return <div ref={ref} className={cx('pf-card__header', className)} {...props} />;
}
CardHeader.displayName = 'CardHeader';

export function CardContent({ className, ref, ...props }: CardSectionProps) {
  return <div ref={ref} className={cx('pf-card__content', className)} {...props} />;
}
CardContent.displayName = 'CardContent';

export function CardFooter({ className, ref, ...props }: CardSectionProps) {
  return <div ref={ref} className={cx('pf-card__footer', className)} {...props} />;
}
CardFooter.displayName = 'CardFooter';
