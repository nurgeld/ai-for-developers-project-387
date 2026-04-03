import { useEffect, useState } from 'react';
import { 
  Table, Button, Group, TextInput, Textarea, NumberInput, 
  Modal, Stack, Text, Badge, ActionIcon, Card, Loader, Center, Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash, IconClock } from '@tabler/icons-react';
import { apiClient } from '../api/client';
import type { EventType, CreateEventTypeRequest } from '../api/types';

export function EventTypes() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState<CreateEventTypeRequest>({
    title: '',
    description: '',
    durationMinutes: 30,
  });

  const loadEventTypes = async () => {
    try {
      const data = await apiClient.eventTypes.list();
      setEventTypes(data);
    } catch (err) {
      console.error('Failed to load event types:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEventTypes();
  }, []);

  const handleSubmit = async () => {
    try {
      await apiClient.eventTypes.create(form);
      close();
      setForm({ title: '', description: '', durationMinutes: 30 });
      loadEventTypes();
    } catch (err) {
      console.error('Failed to create event type:', err);
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
      <Group justify="space-between">
        <Text size="xl" fw={700}>Типы событий</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Добавить тип события
        </Button>
      </Group>

      {eventTypes.length === 0 ? (
        <Card shadow="sm" padding="lg" withBorder>
          <Text c="dimmed" ta="center">Нет типов событий. Создайте первый тип события.</Text>
        </Card>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Название</Table.Th>
              <Table.Th>Описание</Table.Th>
              <Table.Th>Длительность</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {eventTypes.map((eventType) => (
              <Table.Tr key={eventType.id}>
                <Table.Td>
                  <Text fw={600}>{eventType.title}</Text>
                </Table.Td>
                <Table.Td>{eventType.description}</Table.Td>
                <Table.Td>
                  <Badge leftSection={<IconClock size={12} />}>
                    {eventType.durationMinutes} мин
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Tooltip label="Настроить доступность">
                      <ActionIcon 
                        variant="light" 
                        color="blue"
                        component="a"
                        href={`/event-types/${eventType.id}/availability`}
                      >
                        <IconClock size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Удалить">
                      <ActionIcon 
                        variant="light" 
                        color="red"
                        onClick={async () => {
                          if (confirm('Удалить этот тип события?')) {
                            setEventTypes(prev => prev.filter(e => e.id !== eventType.id));
                          }
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={opened} onClose={close} title="Добавить тип события" centered>
        <Stack>
          <TextInput
            label="Название"
            placeholder="Консультация"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <Textarea
            label="Описание"
            placeholder="Описание вашего события"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <NumberInput
            label="Длительность (минуты)"
            value={form.durationMinutes}
            onChange={(val) => setForm({ ...form, durationMinutes: Number(val) })}
            min={5}
            max={480}
            required
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
