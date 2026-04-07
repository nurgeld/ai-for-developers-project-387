import { Stack, Button, Text, Paper, Group } from '@mantine/core';
import type { Slot } from '../../api/types';
import { dayjs } from '../../lib/dayjs';

interface SlotListProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
}

export function SlotList({ slots, selectedSlot, onSelect }: SlotListProps) {
  if (slots.length === 0) {
    return (
      <Paper withBorder p="lg" radius="md">
        <Text c="dimmed" ta="center">Выберите дату в календаре.</Text>
      </Paper>
    );
  }

  return (
    <Stack gap="xs">
      {slots.map((slot) => {
        const start = dayjs.utc(slot.startAt).format('HH:mm');
        const end = dayjs.utc(slot.endAt).format('HH:mm');
        const isSelected =
          selectedSlot?.startAt === slot.startAt;

        return (
          <Button
            key={slot.startAt}
            variant={isSelected ? 'filled' : 'outline'}
            color={slot.isBooked ? 'gray' : isSelected ? 'orange' : 'gray'}
            disabled={slot.isBooked}
            onClick={() => onSelect(slot)}
            fullWidth
            justify="space-between"
            h="auto"
            py="sm"
            styles={{
              inner: { justifyContent: 'space-between', width: '100%' },
              label: { width: '100%' },
            }}
          >
            <Group justify="space-between" w="100%">
              <Text size="sm" c="dark">{start} - {end}</Text>
              <Text size="sm" fw={600} c="dark">
                {slot.isBooked ? 'Занято' : 'Свободно'}
              </Text>
            </Group>
          </Button>
        );
      })}
    </Stack>
  );
}
