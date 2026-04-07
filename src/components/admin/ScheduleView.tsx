import { useMemo } from 'react';
import { Center, Loader, Paper } from '@mantine/core';
import { Schedule } from '@mantine/schedule';
import { useOwnerBookings } from '../../hooks/useOwnerBookings';
import { useOwnerSettings } from '../../hooks/useOwnerSettings';
import { dayjs } from '../../lib/dayjs';

// Mantine colors for different event types
const COLORS = [
  'blue',
  'cyan',
  'grape',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'red',
  'teal',
  'violet',
  'yellow',
] as const;

// Simple hash for deterministic color selection by eventTypeId
function getColorForEventType(eventTypeId: string): string {
  let hash = 0;
  for (let i = 0; i < eventTypeId.length; i++) {
    hash = eventTypeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function ScheduleView() {
  const { data: bookings, isLoading } = useOwnerBookings();
  const { data: settings } = useOwnerSettings();

  const events = useMemo(() => {
    if (!bookings) return [];

    return bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.eventTypeName} - ${booking.guestName}`,
      start: dayjs.utc(booking.startAt).format('YYYY-MM-DD HH:mm:ss'),
      end: dayjs.utc(booking.endAt).format('YYYY-MM-DD HH:mm:ss'),
      color: getColorForEventType(booking.eventTypeId),
    }));
  }, [bookings]);

  if (isLoading && !bookings) {
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
  }

  const startTime = settings?.workDayStart
    ? `${settings.workDayStart}:00`
    : '09:00:00';
  const endTime = settings?.workDayEnd
    ? `${settings.workDayEnd}:00`
    : '18:00:00';

  return (
    <Paper withBorder p="md" radius="md">
      <Schedule
        events={events}
        defaultView="month"
        mode="static"
        dayViewProps={{
          startTime,
          endTime,
          intervalMinutes: 30,
        }}
        weekViewProps={{
          startTime,
          endTime,
          withWeekendDays: false,
        }}
        monthViewProps={{
          withWeekNumbers: true,
          firstDayOfWeek: 1,
        }}
      />
    </Paper>
  );
}
