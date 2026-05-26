import { cx } from '../../utils/cx';
import './Card.css';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;
export type CardSectionProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cx('pf-card', className)} {...props} />;
}
export function CardHeader({ className, ...props }: CardSectionProps) {
  return <div className={cx('pf-card__header', className)} {...props} />;
}
export function CardContent({ className, ...props }: CardSectionProps) {
  return <div className={cx('pf-card__content', className)} {...props} />;
}
export function CardFooter({ className, ...props }: CardSectionProps) {
  return <div className={cx('pf-card__footer', className)} {...props} />;
}
