import { useMemo, useState } from 'react';
import { DatePicker } from '@mantine/dates';
import { Box, ActionIcon, Text, Group } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import type { Slot } from '../../api/types';
import { dayjs } from '../../lib/dayjs';

interface SlotCalendarProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  monthSlots: Slot[];
  onMonthChange: (date: Date) => void;
}

// Russian month names (nominative case for header)
const RUSSIAN_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function SlotCalendar({
  value,
  onChange,
  monthSlots,
  onMonthChange,
}: SlotCalendarProps) {
  const today = dayjs().startOf('day');
  const todayKey = today.format('YYYY-MM-DD');
  const [currentDate, setCurrentDate] = useState(dayjs().toDate());

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

  const handlePrevMonth = () => {
    const newDate = dayjs(currentDate).subtract(1, 'month');
    setCurrentDate(newDate.toDate());
    onMonthChange(newDate.toDate());
  };

  const handleNextMonth = () => {
    const newDate = dayjs(currentDate).add(1, 'month');
    setCurrentDate(newDate.toDate());
    onMonthChange(newDate.toDate());
  };

  const handleDateChange = (date: string) => {
    const dateObj = dayjs(date).toDate();
    setCurrentDate(dateObj);
    onMonthChange(dateObj);
  };

  const monthIndex = dayjs(currentDate).month();
  const year = dayjs(currentDate).year();

  return (
    <Box>
      {/* Custom Russian Calendar Header */}
      <Group justify="space-between" align="center" px="xs" py="xs">
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={handlePrevMonth}
          aria-label="Предыдущий месяц"
          disabled={dayjs(currentDate).isSame(today, 'month')}
        >
          <IconChevronLeft size={20} />
        </ActionIcon>

        <Text fw={500} size="sm" c="gray.7" style={{ textTransform: 'capitalize' }}>
          {RUSSIAN_MONTHS[monthIndex]} {year}
        </Text>

        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={handleNextMonth}
          aria-label="Следующий месяц"
        >
          <IconChevronRight size={20} />
        </ActionIcon>
      </Group>

      {/* DatePicker without header */}
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
        onDateChange={handleDateChange}
        date={dayjs(currentDate).format('YYYY-MM-DD')}
        size="md"
        firstDayOfWeek={1}
        minDate={today.format('YYYY-MM-DD')}
        excludeDate={(date) => dayjs(date).isBefore(today, 'day')}
        styles={{
          calendarHeader: {
            display: 'none', // Hide default header
          },
          calendarHeaderControl: {
            display: 'none',
          },
          weekday: {
            fontWeight: 500,
            fontSize: '12px',
            color: 'var(--mantine-color-gray-5)',
            textTransform: 'lowercase',
            '&[dataWeekday="0"] span::before': { content: '"вс"' },
            '&[dataWeekday="1"] span::before': { content: '"пн"' },
            '&[dataWeekday="2"] span::before': { content: '"вт"' },
            '&[dataWeekday="3"] span::before': { content: '"ср"' },
            '&[dataWeekday="4"] span::before': { content: '"чт"' },
            '&[dataWeekday="5"] span::before': { content: '"пт"' },
            '&[dataWeekday="6"] span::before': { content: '"сб"' },
            '& span': { fontSize: 0 },
          },
          day: {
            height: 44,
            width: 44,
            padding: 2,
            borderRadius: '50%',
            '&[dataSelected]': {
              backgroundColor: 'var(--mantine-color-orange-5)',
              color: 'white',
            },
            '&[dataSelected]:hover': {
              backgroundColor: 'var(--mantine-color-orange-6)',
            },
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

          const cellStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            borderRadius: '50%',
            border: isToday ? '1px solid var(--mantine-color-orange-5)' : undefined,
            backgroundColor: isSelected ? 'var(--mantine-color-orange-5)' : undefined,
            color: isSelected ? 'white' : isPast ? 'var(--mantine-color-gray-4)' : 'var(--mantine-color-gray-8)',
            fontSize: '14px',
            fontWeight: isToday || isSelected ? 500 : 400,
            transition: 'all 0.15s ease',
          };

          return (
            <div style={cellStyle}>
              <span>{day.date()}</span>
              {hasAvailability && !isSelected && (
                <Box
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'var(--mantine-color-green-5)',
                    marginTop: 2,
                  }}
                />
              )}
            </div>
          );
        }}
      />
    </Box>
  );
}
