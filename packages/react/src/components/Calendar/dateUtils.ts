/* Shared date helpers for Calendar and DateRangePicker. All dates are pinned
   to midday to dodge DST boundary edge cases. Internal — not part of the
   public package API. */

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

export const toMidday = (date: Date) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
};

export const isSameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
};

export const addMonths = (date: Date, amount: number) => {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
};

export const buildCalendarDays = (monthDate: Date) => {
  const monthStart = startOfMonth(monthDate);
  const firstWeekday = monthStart.getDay();
  const gridStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    monthStart.getDate() - firstWeekday,
    12,
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
      12,
    );

    return {
      date,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
};
