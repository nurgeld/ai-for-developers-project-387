import { useEffect, useState } from 'react';
import { 
  Table, Button, Group, Text, Stack, Card, Loader, Center, 
  SimpleGrid
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { apiClient } from '../api/client';
import type { Booking, EventType } from '../api/types';

export function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const [eventTypesData, bookingsData] = await Promise.all([
        apiClient.eventTypes.list(),
        apiClient.bookings.list(),
      ]);
      setEventTypes(eventTypesData);
      
      let filtered = bookingsData;
      if (startDate) {
        filtered = filtered.filter(b => new Date(b.startAt) >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(b => new Date(b.startAt) <= endDate);
      }
      setBookings(filtered);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTypeTitle = (eventTypeId: string) => {
    return eventTypes.find(e => e.id === eventTypeId)?.title || eventTypeId;
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Text size="xl" fw={700}>Бронирования</Text>
        <Button onClick={loadData}>Обновить</Button>
      </Group>

      <Card shadow="sm" padding="md" withBorder>
        <Text size="sm" fw={600} mb="sm">Фильтры по дате</Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <DateTimePicker
            label="С"
            placeholder="Дата начала"
            value={startDate}
            onChange={(val) => setStartDate(val ? new Date(val) : null)}
            clearable
          />
          <DateTimePicker
            label="По"
            placeholder="Дата окончания"
            value={endDate}
            onChange={(val) => setEndDate(val ? new Date(val) : null)}
            clearable
          />
        </SimpleGrid>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => {
            setStartDate(null);
            setEndDate(null);
            loadData();
          }}>
            Сбросить
          </Button>
          <Button onClick={loadData}>Применить</Button>
        </Group>
      </Card>

      {bookings.length === 0 ? (
        <Card shadow="sm" padding="lg" withBorder>
          <Text c="dimmed" ta="center">Нет бронирований.</Text>
        </Card>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Тип события</Table.Th>
              <Table.Th>Гость</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Начало</Table.Th>
              <Table.Th>Конец</Table.Th>
              <Table.Th>Создано</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bookings.map((booking) => (
              <Table.Tr key={booking.id}>
                <Table.Td>{getEventTypeTitle(booking.eventTypeId)}</Table.Td>
                <Table.Td>
                  <Text fw={600}>{booking.guestName}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">{booking.guestEmail}</Text>
                </Table.Td>
                <Table.Td>{formatDateTime(booking.startAt)}</Table.Td>
                <Table.Td>{formatDateTime(booking.endAt)}</Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{formatDateTime(booking.createdAt)}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
