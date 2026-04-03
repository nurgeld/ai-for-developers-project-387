import { useEffect, useState } from 'react';
import { 
  Table, Button, Group, Text, Stack, Badge, Card, Loader, Center, 
  Select, SimpleGrid
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { apiClient } from '../api/client';
import type { Slot, EventType } from '../api/types';

export function Slots() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const [eventTypesData, slotsData] = await Promise.all([
        apiClient.eventTypes.list(),
        apiClient.slots.list({ eventTypeId: selectedEventType || '' }),
      ]);
      setEventTypes(eventTypesData);
      
      let filtered = slotsData;
      if (selectedEventType) {
        filtered = filtered.filter(s => s.eventTypeId === selectedEventType);
      }
      if (startDate) {
        filtered = filtered.filter(s => new Date(s.startAt) >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(s => new Date(s.startAt) <= endDate);
      }
      setSlots(filtered);
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedEventType]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
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
      <Text size="xl" fw={700}>Слоты</Text>

      <Card shadow="sm" padding="md" withBorder>
        <Text size="sm" fw={600} mb="sm">Фильтры</Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select
            label="Тип события"
            placeholder="Все типы"
            data={eventTypes.map(e => ({ value: e.id, label: e.title }))}
            value={selectedEventType}
            onChange={(val) => setSelectedEventType(val)}
            clearable
          />
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
            setSelectedEventType(null);
            setStartDate(null);
            setEndDate(null);
            loadData();
          }}>
            Сбросить
          </Button>
          <Button onClick={loadData}>Применить</Button>
        </Group>
      </Card>

      {slots.length === 0 ? (
        <Card shadow="sm" padding="lg" withBorder>
          <Text c="dimmed" ta="center">Нет слотов для отображения.</Text>
        </Card>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Тип события</Table.Th>
              <Table.Th>Начало</Table.Th>
              <Table.Th>Конец</Table.Th>
              <Table.Th>Статус</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {slots.map((slot) => (
              <Table.Tr key={slot.id}>
                <Table.Td>{getEventTypeTitle(slot.eventTypeId)}</Table.Td>
                <Table.Td>{formatDateTime(slot.startAt)}</Table.Td>
                <Table.Td>{formatDateTime(slot.endAt)}</Table.Td>
                <Table.Td>
                  <Badge color={slot.isBooked ? 'red' : 'green'}>
                    {slot.isBooked ? 'Забронирован' : 'Свободен'}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
