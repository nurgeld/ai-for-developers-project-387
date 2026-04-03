import { useEffect, useState } from 'react';
import { SimpleGrid, Card, Text, Group, Badge, RingProgress, Center, Stack, Loader } from '@mantine/core';
import { IconCalendarEvent, IconClock, IconCalendarCheck } from '@tabler/icons-react';
import { apiClient } from '../api/client';
import type { Slot } from '../api/types';

interface Stats {
  eventTypesCount: number;
  slotsCount: number;
  bookedSlotsCount: number;
  bookingsCount: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventTypes, slots, bookings] = await Promise.all([
          apiClient.eventTypes.list(),
          apiClient.slots.list({ eventTypeId: '' }),
          apiClient.bookings.list(),
        ]);

        setStats({
          eventTypesCount: eventTypes.length,
          slotsCount: slots.length,
          bookedSlotsCount: slots.filter((s: Slot) => s.isBooked).length,
          bookingsCount: bookings.length,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
        setStats({
          eventTypesCount: 0,
          slotsCount: 0,
          bookedSlotsCount: 0,
          bookingsCount: 0,
        });
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  const bookedPercent = stats ? Math.round((stats.bookedSlotsCount / (stats.slotsCount || 1)) * 100) : 0;

  return (
    <Stack gap="lg">
      <Text size="xl" fw={700}>Dashboard</Text>
      
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Типы событий</Text>
              <Text size="xl" fw={700}>{stats?.eventTypesCount}</Text>
            </div>
            <IconCalendarEvent size={32} color="#228be6" />
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Всего слотов</Text>
              <Text size="xl" fw={700}>{stats?.slotsCount}</Text>
            </div>
            <IconClock size={32} color="#40c057" />
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Забронировано</Text>
              <Text size="xl" fw={700}>{stats?.bookedSlotsCount}</Text>
            </div>
            <IconCalendarCheck size={32} color="#fab005" />
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Бронирований</Text>
              <Text size="xl" fw={700}>{stats?.bookingsCount}</Text>
            </div>
            <Badge size="lg" variant="light">Всего</Badge>
          </Group>
        </Card>
      </SimpleGrid>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="lg" fw={600} mb="md">Загрузка слотов</Text>
        <Center>
          <RingProgress
            size={150}
            thickness={14}
            roundCaps
            sections={[{ value: bookedPercent, color: 'blue' }]}
            label={
              <Center>
                <Text size="xl" fw={700}>{bookedPercent}%</Text>
              </Center>
            }
          />
        </Center>
        <Text size="sm" c="dimmed" ta="center" mt="md">
          Процент забронированных слотов
        </Text>
      </Card>
    </Stack>
  );
}
