import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

const items = [
  { value: 'overview', label: 'Overview', content: <p>Overview content</p> },
  { value: 'details', label: 'Details', content: <p>Details content</p> },
  { value: 'history', label: 'History', content: <p>History content</p>, disabled: true },
];

describe('Tabs', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a tablist with tabs', () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('renders the active tab panel', () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText('Overview content')).toBeInTheDocument();
  });

  it('selects the first enabled tab by default', () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected', 'true',
    );
  });

  it('selects the defaultValue tab in uncontrolled mode', () => {
    render(<Tabs items={items} defaultValue="details" />);
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected', 'true',
    );
    expect(screen.getByText('Details content')).toBeInTheDocument();
  });

  it('reflects the controlled value', () => {
    render(<Tabs items={items} value="details" onValueChange={vi.fn()} />);
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected', 'true',
    );
    expect(screen.getByText('Details content')).toBeInTheDocument();
  });

  // ─── ARIA wiring ─────────────────────────────────────────────────────────

  it('links each tab to its panel via aria-controls / aria-labelledby', () => {
    render(<Tabs items={items} />);
    const tab = screen.getByRole('tab', { name: 'Overview' });
    const panel = screen.getByRole('tabpanel');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('marks non-selected tabs with aria-selected=false', () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected', 'false',
    );
  });

  // ─── Tab switching ───────────────────────────────────────────────────────

  it('switches to a tab on click', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    await user.click(screen.getByRole('tab', { name: 'Details' }));
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected', 'true',
    );
    expect(screen.getByText('Details content')).toBeInTheDocument();
    expect(screen.queryByText('Overview content')).not.toBeInTheDocument();
  });

  it('calls onValueChange with the selected value on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tabs items={items} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('tab', { name: 'Details' }));
    expect(onValueChange).toHaveBeenCalledWith('details');
  });

  // ─── Keyboard navigation ─────────────────────────────────────────────────

  it('moves to the next tab on ArrowRight', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    screen.getByRole('tab', { name: 'Overview' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected', 'true',
    );
  });

  it('moves to the previous tab on ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="details" />);
    screen.getByRole('tab', { name: 'Details' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected', 'true',
    );
  });

  it('wraps ArrowRight from last enabled tab to first', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="details" />);
    screen.getByRole('tab', { name: 'Details' }).focus();
    await user.keyboard('{ArrowRight}');
    // History is disabled so wraps back to Overview
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });

  it('jumps to the first tab on Home key', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="details" />);
    screen.getByRole('tab', { name: 'Details' }).focus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });

  it('jumps to the last enabled tab on End key', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    screen.getByRole('tab', { name: 'Overview' }).focus();
    await user.keyboard('{End}');
    // History is disabled, so last enabled is Details
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();
  });

  // ─── Disabled tab ────────────────────────────────────────────────────────

  it('marks disabled tabs with the disabled attribute', () => {
    render(<Tabs items={items} />);
    expect(screen.getByRole('tab', { name: 'History' })).toBeDisabled();
  });

  it('skips disabled tabs during ArrowRight navigation', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} defaultValue="details" />);
    screen.getByRole('tab', { name: 'Details' }).focus();
    // ArrowRight from Details → History is disabled → wraps to Overview
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });

  // ─── Variants & sizes ────────────────────────────────────────────────────

  it('applies the pills variant class', () => {
    render(<Tabs items={items} variant="pills" />);
    expect(screen.getByRole('tablist')).toHaveClass('pf-tabs__list--pills');
  });

  it('applies the sm size class', () => {
    render(<Tabs items={items} size="sm" />);
    expect(screen.getByRole('tablist')).toHaveClass('pf-tabs__list--sm');
  });

  it('applies the full-width class', () => {
    render(<Tabs items={items} fullWidth />);
    expect(screen.getByRole('tablist')).toHaveClass('pf-tabs__list--full-width');
  });
});
