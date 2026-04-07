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
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <Text c="dimmed" ta="center">Выберите дату в календаре</Text>
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

        // Вариант А: filled (выбранный), light (свободный), outline disabled (занят)
        const variant = isSelected
          ? 'filled'
          : slot.isBooked
            ? 'outline'
            : 'light';

        const color = isSelected
          ? 'orange'
          : 'gray';

        return (
          <Button
            key={slot.startAt}
            variant={variant}
            color={color}
            disabled={slot.isBooked}
            onClick={() => onSelect(slot)}
            fullWidth
            justify="space-between"
          >
            <Group justify="space-between" w="100%">
              <Text size="sm">{start} - {end}</Text>
              <Text size="sm" fw={600}>
                {slot.isBooked ? 'Занято' : 'Свободно'}
              </Text>
            </Group>
          </Button>
        );
      })}
    </Stack>
  );
}
