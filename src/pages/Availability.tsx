import { useEffect, useState } from 'react';
import { 
  Table, Button, Group, Text, Stack, Badge, ActionIcon, 
  Card, Loader, Center, Modal, Select, TextInput, Tooltip, Breadcrumbs, Anchor
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash, IconArrowLeft } from '@tabler/icons-react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { AvailabilityPeriod, EventType, CreateAvailabilityRequest } from '../api/types';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Понедельник' },
  { value: '1', label: 'Вторник' },
  { value: '2', label: 'Среда' },
  { value: '3', label: 'Четверг' },
  { value: '4', label: 'Пятница' },
  { value: '5', label: 'Суббота' },
  { value: '6', label: 'Воскресенье' },
];

export function Availability() {
  const { id } = useParams<{ id: string }>();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [availability, setAvailability] = useState<AvailabilityPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState<CreateAvailabilityRequest>({
    eventTypeId: id || '',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
  });

  const loadData = async () => {
    if (!id) return;
    try {
      const [eventTypes, availabilityData] = await Promise.all([
        apiClient.eventTypes.list(),
        apiClient.availability.list({ eventTypeId: id }),
      ]);
      const found = eventTypes.find(e => e.id === id);
      setEventType(found || null);
      setAvailability(availabilityData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSubmit = async () => {
    try {
      await apiClient.availability.create(form);
      close();
      setForm({ eventTypeId: id || '', dayOfWeek: 0, startTime: '09:00', endTime: '17:00' });
      loadData();
    } catch (err) {
      console.error('Failed to create availability:', err);
    }
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
      <Breadcrumbs>
        <Anchor component={Link} to="/event-types">Типы событий</Anchor>
        <Text>{eventType?.title || 'Доступность'}</Text>
      </Breadcrumbs>

      <Group justify="space-between">
        <Group>
          <Button variant="default" component={Link} to="/event-types" leftSection={<IconArrowLeft size={16} />}>
            Назад
          </Button>
          <Text size="xl" fw={700}>Доступность: {eventType?.title}</Text>
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Добавить период
        </Button>
      </Group>

      {availability.length === 0 ? (
        <Card shadow="sm" padding="lg" withBorder>
          <Text c="dimmed" ta="center">Нет периодов доступности. Добавьте первый период.</Text>
        </Card>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>День недели</Table.Th>
              <Table.Th>Время начала</Table.Th>
              <Table.Th>Время окончания</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {availability.map((period) => (
              <Table.Tr key={period.id}>
                <Table.Td>
                  <Badge>{DAYS_OF_WEEK.find(d => d.value === String(period.dayOfWeek))?.label}</Badge>
                </Table.Td>
                <Table.Td>{period.startTime}</Table.Td>
                <Table.Td>{period.endTime}</Table.Td>
                <Table.Td>
                  <Tooltip label="Удалить">
                    <ActionIcon 
                      variant="light" 
                      color="red"
                      onClick={async () => {
                        if (confirm('Удалить этот период?')) {
                          setAvailability(prev => prev.filter(p => p.id !== period.id));
                        }
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={close} title="Добавить период доступности" centered>
        <Stack>
          <Select
            label="День недели"
            data={DAYS_OF_WEEK}
            value={String(form.dayOfWeek)}
            onChange={(val) => setForm({ ...form, dayOfWeek: Number(val) })}
          />
          <TextInput
            label="Время начала"
            placeholder="09:00"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
          <TextInput
            label="Время окончания"
            placeholder="17:00"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Отмена</Button>
            <Button onClick={handleSubmit}>Создать</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
