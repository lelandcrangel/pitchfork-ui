import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './ComponentName.css';

export interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cx('pf-component-name', className)} {...props} />;
});

ComponentName.displayName = 'ComponentName';
