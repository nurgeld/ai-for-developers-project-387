import { Stack, Button, Text, Paper, Group, ThemeIcon } from '@mantine/core';
import { IconClock, IconCheck, IconX } from '@tabler/icons-react';
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
      <Paper withBorder p="lg" radius="md" bg="gray.0">
        <Group justify="center" gap="xs">
          <ThemeIcon size="sm" variant="light" color="gray">
            <IconClock size={14} />
          </ThemeIcon>
          <Text c="dimmed" ta="center">Выберите дату в календаре</Text>
        </Group>
      </Paper>
    );
  }

  return (
    <Stack gap="xs">
      {slots.map((slot) => {
        const start = dayjs.utc(slot.startAt).format('HH:mm');
        const end = dayjs.utc(slot.endAt).format('HH:mm');
        const isSelected = selectedSlot?.startAt === slot.startAt;

        // Variant: filled (selected), light (available), outline disabled (booked)
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
            leftSection={
              isSelected ? (
                <Group gap={6} wrap="nowrap">
                  <IconCheck size={16} />
                  <Text size="sm" fw={500}>{start} - {end}</Text>
                </Group>
              ) : (
                <Group gap={6} wrap="nowrap">
                  <IconClock size={16} />
                  <Text size="sm">{start} - {end}</Text>
                </Group>
              )
            }
            styles={{
              root: {
                opacity: slot.isBooked ? 0.6 : 1,
              },
              inner: {
                justifyContent: 'space-between',
              },
            }}
          >
            <Group gap={4} wrap="nowrap">
              {slot.isBooked && <IconX size={14} />}
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
