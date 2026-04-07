import { Paper, Text, Group, Button, Stack, ThemeIcon, Badge } from '@mantine/core';
import { IconCalendar, IconMail, IconUser, IconClock, IconTrash } from '@tabler/icons-react';
import type { Booking } from '../../api/types';
import { dayjs } from '../../lib/dayjs';

interface BookingCardProps {
  booking: Booking;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}

export function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
  const isPast = dayjs.utc(booking.startAt).isBefore(dayjs());

  return (
    <Paper
      withBorder
      p="lg"
      radius="md"
      style={{
        opacity: isPast ? 0.7 : 1,
        borderLeft: `4px solid ${isPast ? 'var(--mantine-color-gray-4)' : 'var(--mantine-color-orange-5)'}`,
      }}
    >
      <Group justify="space-between" align="flex-start">
        <Stack gap="xs">
          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color={isPast ? 'gray' : 'orange'}>
              <IconUser size={14} />
            </ThemeIcon>
            <Text fw={600} c={isPast ? 'gray.6' : 'dark'}>
              {booking.guestName}
            </Text>
          </Group>

          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="gray">
              <IconMail size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">{booking.guestEmail}</Text>
          </Group>

          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="gray">
              <IconClock size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {dayjs.utc(booking.startAt).format('DD MMMM YYYY, HH:mm')}
            </Text>
          </Group>

          <Group gap="xs">
            <ThemeIcon size="sm" variant="light" color="gray">
              <IconCalendar size={14} />
            </ThemeIcon>
            <Badge size="sm" variant="light" color="gray">
              {booking.eventTypeName}
            </Badge>
          </Group>
        </Stack>

        <Button
          variant="subtle"
          color="red"
          size="xs"
          leftSection={<IconTrash size={14} />}
          onClick={() => onCancel(booking.id)}
          loading={isCancelling}
          disabled={isPast}
        >
          Отменить
        </Button>
      </Group>
    </Paper>
  );
}
