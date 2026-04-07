import { Stack, Text, Card, Divider } from '@mantine/core';
import type { EventType, Slot } from '../../api/types';
import { OwnerProfile } from './OwnerProfile';
import type { OwnerSettings } from '../../api/types';
import { dayjs } from '../../lib/dayjs';

interface BookingSummaryProps {
  settings: OwnerSettings;
  eventType: EventType;
  selectedDate: Date | null;
  selectedSlot: Slot | null;
  freeCount: number;
  totalCount: number;
}

export function BookingSummary({
  settings,
  eventType,
  selectedDate,
  selectedSlot,
  freeCount,
  totalCount,
}: BookingSummaryProps) {
  return (
    <Card withBorder shadow="sm" radius="md">
      <Stack gap="md">
        <OwnerProfile settings={settings} />

        <Divider />

        <div>
          <Text fw={600} size="lg">{eventType.name}</Text>
          <Text size="sm" c="dimmed">{eventType.description}</Text>
        </div>

        <Card withBorder p="sm" radius="sm" bg="gray.0">
          <Text size="xs" c="dimmed">Выбранная дата</Text>
          <Text fw={500}>
            {selectedDate
              ? dayjs(selectedDate).format('dddd, D MMMM')
              : 'Дата не выбрана'}
          </Text>
        </Card>

        <Card withBorder p="sm" radius="sm" bg="gray.0">
          <Text size="xs" c="dimmed">Выбранное время</Text>
          <Text fw={500}>
            {selectedSlot
              ? `${dayjs.utc(selectedSlot.startAt).format('HH:mm')} - ${dayjs.utc(selectedSlot.endAt).format('HH:mm')}`
              : 'Время не выбрано'}
          </Text>
        </Card>

        <Card withBorder p="sm" radius="sm" bg="gray.0">
          <Text size="xs" c="dimmed">Свободно</Text>
          <Text fw={500}>{freeCount}</Text>
        </Card>

        <Card withBorder p="sm" radius="sm" bg="gray.0">
          <Text size="xs" c="dimmed">Длительность</Text>
          <Text fw={500}>
            {totalCount > 0
              ? `${eventType.durationMinutes} мин`
              : 'Нет слотов на этот день'}
          </Text>
        </Card>
      </Stack>
    </Card>
  );
}
