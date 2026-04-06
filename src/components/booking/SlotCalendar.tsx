import { useMemo } from 'react';
import { DatePicker } from '@mantine/dates';
import { Indicator } from '@mantine/core';
import type { Slot } from '../../api/types';
import { dayjs } from '../../lib/dayjs';

interface SlotCalendarProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  monthSlots: Slot[];
  onMonthChange: (date: Date) => void;
}

export function SlotCalendar({
  value,
  onChange,
  monthSlots,
  onMonthChange,
}: SlotCalendarProps) {
  const today = dayjs().startOf('day');
  const todayKey = today.format('YYYY-MM-DD');

  const freeCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const slot of monthSlots) {
      if (!slot.isBooked) {
        const key = dayjs.utc(slot.startAt).format('YYYY-MM-DD');
        map[key] = (map[key] ?? 0) + 1;
      }
    }
    return map;
  }, [monthSlots]);

  const selectedKey = value ? dayjs(value).format('YYYY-MM-DD') : null;

  return (
    <DatePicker
      value={value ? dayjs(value).format('YYYY-MM-DD') : null}
      onChange={(val) => {
        if (!val) {
          onChange(null);
          return;
        }

        const nextDate = dayjs(val);

        onChange(nextDate.isBefore(today, 'day') ? null : nextDate.toDate());
      }}
      onDateChange={(date) => {
        onMonthChange(dayjs(date).toDate());
      }}
      size="lg"
      firstDayOfWeek={1}
      minDate={today.format('YYYY-MM-DD')}
      excludeDate={(date) => dayjs(date).isBefore(today, 'day')}
      styles={{
        day: {
          height: 48,
          width: 48,
          padding: 4,
        },
        calendarHeader: {
          fontWeight: 600,
        },
      }}
      renderDay={(date) => {
        const day = dayjs(date);
        const key = day.format('YYYY-MM-DD');
        const count = freeCountByDate[key];
        const isSelected = selectedKey === key;
        const isToday = todayKey === key;
        const isPast = day.isBefore(today, 'day');
        const hasAvailability = count !== undefined && count > 0 && !isPast;

        // Styles for different states
        const cellStyle: React.CSSProperties = {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          borderRadius: isToday ? 4 : undefined,
          border: isToday ? '2px solid var(--mantine-color-orange-5)' : undefined,
          backgroundColor: isSelected ? 'var(--mantine-color-orange-1)' : undefined,
        };

        const textColor = isPast ? 'var(--mantine-color-gray-5)' : undefined;

        return (
          <div style={cellStyle}>
            <span style={{ fontSize: 16, color: textColor }}>{day.date()}</span>
            {hasAvailability && !isSelected && (
              <Indicator color="green" size={8} mt={2} />
            )}
          </div>
        );
      }}
    />
  );
}
