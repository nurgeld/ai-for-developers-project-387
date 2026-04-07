import { Card, Group, Text, Badge, Stack, Box } from '@mantine/core';
import { IconClock, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import type { EventType } from '../../api/types';

interface EventTypeCardProps {
  eventType: EventType;
}

export function EventTypeCard({ eventType }: EventTypeCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      style={{ cursor: 'pointer' }}
      onClick={() =>
        navigate({ to: '/book/$eventTypeId', params: { eventTypeId: eventType.id } })
      }
      styles={{
        root: {
          transition: 'transform 150ms ease, box-shadow 150ms ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 'var(--mantine-shadow-md)',
          },
        },
      }}
    >
      <Stack gap="md" h="100%" justify="space-between">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} size="lg" lineClamp={1}>{eventType.name}</Text>
            <Text size="sm" c="dimmed" mt={4} lineClamp={2}>
              {eventType.description}
            </Text>
          </Box>
          <Badge
            variant="light"
            color="orange"
            size="lg"
            leftSection={<IconClock size={14} />}
            style={{ flexShrink: 0 }}
          >
            {eventType.durationMinutes} мин
          </Badge>
        </Group>

        <Group gap={4} c="orange" style={{ marginTop: 'auto' }}>
          <Text size="sm" fw={500}>Выбрать дату</Text>
          <IconArrowRight size={16} />
        </Group>
      </Stack>
    </Card>
  );
}
