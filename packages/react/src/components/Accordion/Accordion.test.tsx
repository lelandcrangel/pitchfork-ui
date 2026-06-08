import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Accordion, type AccordionItemData } from './Accordion';

const items: AccordionItemData[] = [
  { value: 'one', title: 'First', content: 'First panel content' },
  { value: 'two', title: 'Second', content: 'Second panel content' },
  { value: 'three', title: 'Third', content: 'Third panel content', disabled: true },
];

describe('Accordion', () => {
  it('renders a trigger button per item', () => {
    render(<Accordion items={items} />);
    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Third' })).toBeInTheDocument();
  });

  it('marks triggers collapsed by default', () => {
    render(<Accordion items={items} />);
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands a panel on click and wires aria-controls/labelledby', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const trigger = screen.getByRole('button', { name: 'First' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: 'First' });
    expect(region).toHaveAttribute('aria-labelledby', trigger.id);
    expect(trigger).toHaveAttribute('aria-controls', region.id);
  });

  it('collapses other panels in single mode', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    await user.click(screen.getByRole('button', { name: 'First' }));
    await user.click(screen.getByRole('button', { name: 'Second' }));
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps multiple panels open in multiple mode', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} type="multiple" />);
    await user.click(screen.getByRole('button', { name: 'First' }));
    await user.click(screen.getByRole('button', { name: 'Second' }));
    expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('toggles a panel closed on second click', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const trigger = screen.getByRole('button', { name: 'First' });
    await user.click(trigger);
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('respects defaultValue', () => {
    render(<Accordion items={items} defaultValue={['two']} />);
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onValueChange with the expanded values', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Accordion items={items} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'First' }));
    expect(onValueChange).toHaveBeenCalledWith(['one']);
  });

  it('disables the disabled item trigger', () => {
    render(<Accordion items={items} />);
    expect(screen.getByRole('button', { name: 'Third' })).toBeDisabled();
  });

  it('moves focus to the next trigger on ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    const first = screen.getByRole('button', { name: 'First' });
    first.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
  });

  it('skips the disabled trigger during ArrowDown navigation', async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    screen.getByRole('button', { name: 'Second' }).focus();
    // wraps past the disabled "Third" back to "First"
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('forwards extra props to the root element', () => {
    render(<Accordion items={items} data-testid="accordion" />);
    expect(screen.getByTestId('accordion')).toBeInTheDocument();
  });
});
