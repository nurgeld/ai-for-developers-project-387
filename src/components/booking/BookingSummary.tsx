import { Stack, Text, Paper, Divider, Group, ThemeIcon, Box } from '@mantine/core';
import { IconUser, IconCalendar, IconClock, IconHourglass } from '@tabler/icons-react';
import type { EventType, Slot } from '../../api/types';
import { OwnerProfile } from './OwnerProfile';
import type { OwnerSettings } from '../../api/types';
import { dayjs } from '../../lib/dayjs';

interface BookingSummaryProps {
  settings: OwnerSettings;
  eventType: EventType;
  selectedDate: Date | null;
  selectedSlot: Slot | null;
}

export function BookingSummary({
  settings,
  eventType,
  selectedDate,
  selectedSlot,
}: BookingSummaryProps) {
  return (
    <Paper withBorder p="lg" radius="md" mih={600}>
      <Stack gap="md">
        <OwnerProfile settings={settings} />

        <Divider />

        <Group gap="xs" align="flex-start">
          <ThemeIcon size="sm" variant="light" color="orange" style={{ marginTop: 2 }}>
            <IconUser size={14} />
          </ThemeIcon>
          <Box style={{ flex: 1 }}>
            <Text size="xs" c="dimmed">Тип встречи</Text>
            <Text fw={500} size="sm">{eventType.name}</Text>
            {eventType.description && (
              <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
                {eventType.description}
              </Text>
            )}
          </Box>
        </Group>

        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color="orange">
            <IconHourglass size={14} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed">Длительность</Text>
            <Text fw={500} size="sm">{eventType.durationMinutes} мин</Text>
          </div>
        </Group>

        <Divider />

        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color={selectedDate ? 'orange' : 'gray'}>
            <IconCalendar size={14} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed">Дата</Text>
            <Text fw={500} size="sm">
              {selectedDate
                ? dayjs(selectedDate).format('D MMMM')
                : 'Не выбрана'}
            </Text>
          </div>
        </Group>

        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color={selectedSlot ? 'orange' : 'gray'}>
            <IconClock size={14} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed">Время</Text>
            <Text fw={500} size="sm">
              {selectedSlot
                ? `${dayjs.utc(selectedSlot.startAt).format('HH:mm')} - ${dayjs.utc(selectedSlot.endAt).format('HH:mm')}`
                : 'Не выбрано'}
            </Text>
          </div>
        </Group>
      </Stack>
    </Paper>
  );
}
