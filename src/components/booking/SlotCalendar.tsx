import { useMemo } from 'react';
import { DatePicker } from '@mantine/dates';
import { Box } from '@mantine/core';
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
      onDateChange={(dateStr) => {
        onMonthChange(dayjs(dateStr).toDate());
      }}
      locale="ru"
      size="xl"
      firstDayOfWeek={1}
      minDate={today.format('YYYY-MM-DD')}
      excludeDate={(date) => dayjs(date).isBefore(today, 'day')}
      styles={{
        calendarHeader: {
          fontWeight: 600,
          fontSize: '18px',
          color: 'var(--mantine-color-gray-8)',
          textTransform: 'capitalize',
          marginBottom: 12,
        },
        calendarHeaderControl: {
          color: 'var(--mantine-color-gray-7)',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-gray-0)',
          },
        },
        weekday: {
          fontWeight: 600,
          fontSize: '14px',
          color: 'var(--mantine-color-gray-6)',
          textTransform: 'capitalize',
        },
        day: {
          borderRadius: '50%',
          '&[dataSelected]': {
            backgroundColor: 'var(--mantine-color-orange-6)',
            color: 'white',
          },
          '&[dataSelected]:hover': {
            backgroundColor: 'var(--mantine-color-orange-7)',
          },
        },
        monthCell: {
          padding: 4,
        },
      }}
      getDayProps={(date) => {
        const day = dayjs(date);
        const key = day.format('YYYY-MM-DD');
        const isSelected = selectedKey === key;
        const isToday = todayKey === key;
        const isPast = day.isBefore(today, 'day');
        const count = freeCountByDate[key];
        const hasAvailability = count !== undefined && count > 0 && !isPast;

        return {
          style: {
            border: isToday ? '2px solid var(--mantine-color-orange-6)' : undefined,
            backgroundColor: isSelected ? 'var(--mantine-color-orange-6)' : undefined,
            color: isSelected ? 'white' : isPast ? 'var(--mantine-color-gray-4)' : 'var(--mantine-color-gray-9)',
            fontWeight: isToday || isSelected ? 600 : 500,
          },
          // Custom data attribute for renderDay to check availability
          'data-availability': hasAvailability ? 'true' : 'false',
        };
      }}
      renderDay={(date) => {
        const day = dayjs(date);
        const key = day.format('YYYY-MM-DD');
        const count = freeCountByDate[key];
        const isSelected = selectedKey === key;
        const isPast = day.isBefore(today, 'day');
        const hasAvailability = count !== undefined && count > 0 && !isPast;

        const cellStyle: React.CSSProperties = {
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          lineHeight: 1,
          paddingTop: 2,
        };

        return (
          <div style={cellStyle}>
            <span>{day.date()}</span>
            {hasAvailability && !isSelected && (
              <Box
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: 'var(--mantine-color-green-6)',
                  marginTop: 3,
                }}
              />
            )}
          </div>
        );
      }}
    />
  );
}
