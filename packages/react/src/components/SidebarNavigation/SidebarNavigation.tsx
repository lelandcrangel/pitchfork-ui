import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './SidebarNavigation.css';

export interface SidebarNavigationItem {
  label: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  active?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface SidebarNavigationSection {
  title?: React.ReactNode;
  items: SidebarNavigationItem[];
}

export interface SidebarNavigationProps extends React.HTMLAttributes<HTMLElement> {
  sections: SidebarNavigationSection[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

function renderItem(item: SidebarNavigationItem, key: string) {
  const content = (
    <>
      {item.icon ? <span className="pf-sidebar-navigation__icon">{item.icon}</span> : null}
      <span className="pf-sidebar-navigation__label">{item.label}</span>
      {item.badge ? <span className="pf-sidebar-navigation__badge">{item.badge}</span> : null}
    </>
  );

  const className = cx(
    'pf-sidebar-navigation__link',
    item.active && 'pf-sidebar-navigation__link--active',
    item.disabled && 'pf-sidebar-navigation__link--disabled',
  );

  if (item.href && !item.disabled) {
    return (
      <li className="pf-sidebar-navigation__item" key={key}>
        <a
          href={item.href}
          onClick={item.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
          className={className}
          aria-current={item.active ? 'page' : undefined}
        >
          {content}
        </a>
      </li>
    );
  }

  if (item.onClick) {
    return (
      <li className="pf-sidebar-navigation__item" key={key}>
        <button
          type="button"
          onClick={item.onClick as React.MouseEventHandler<HTMLButtonElement>}
          className={className}
          disabled={item.disabled}
          aria-current={item.active ? 'page' : undefined}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li className="pf-sidebar-navigation__item" key={key}>
      <span className={className} aria-current={item.active ? 'page' : undefined}>
        {content}
      </span>
    </li>
  );
}

export const SidebarNavigation = forwardRef<HTMLElement, SidebarNavigationProps>(
  function SidebarNavigation(
    {
      className,
      sections,
      header,
      footer,
      'aria-label': ariaLabel = 'Sidebar navigation',
      ...props
    },
    ref,
  ) {
    return (
      <aside ref={ref} className={cx('pf-sidebar-navigation', className)} {...props}>
        {header ? <div className="pf-sidebar-navigation__header">{header}</div> : null}

        <nav className="pf-sidebar-navigation__nav" aria-label={ariaLabel}>
          {sections.map((section, sectionIndex) => (
            <div className="pf-sidebar-navigation__section" key={`section-${sectionIndex}`}>
              {section.title ? (
                <p className="pf-sidebar-navigation__section-title">{section.title}</p>
              ) : null}

              <ul className="pf-sidebar-navigation__list">
                {section.items.map((item, itemIndex) => {
                  const key = `${sectionIndex}-${itemIndex}-${typeof item.label === 'string' ? item.label : 'item'}`;
                  return renderItem(item, key);
                })}
              </ul>
            </div>
          ))}
        </nav>

        {footer ? <div className="pf-sidebar-navigation__footer">{footer}</div> : null}
      </aside>
    );
  },
);

SidebarNavigation.displayName = 'SidebarNavigation';
