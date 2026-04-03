import { useEffect, useState } from 'react';
import { 
  Stack, Text, Card, Group, Button, Select, TextInput, 
  Loader, Center, SimpleGrid, Title, Alert
} from '@mantine/core';
import { IconCalendarPlus, IconCheck, IconX } from '@tabler/icons-react';
import { apiClient } from '../api/client';
import type { EventType, Slot, CreateBookingRequest } from '../api/types';

export function GuestBooking() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const loadData = async () => {
    try {
      const [eventTypesData, allSlots] = await Promise.all([
        apiClient.eventTypes.list(),
        apiClient.slots.list({ eventTypeId: '' }),
      ]);
      setEventTypes(eventTypesData);
      
      const availableSlots = allSlots.filter(s => !s.isBooked);
      setSlots(availableSlots);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableSlotsForType = slots.filter(s => 
    !selectedEventType || s.eventTypeId === selectedEventType
  );

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedEventType || !guestName || !guestEmail) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const slot = slots.find(s => s.id === selectedSlot);
      if (!slot) throw new Error('Слот не найден');

      const booking: CreateBookingRequest = {
        eventTypeId: selectedEventType,
        startAt: slot.startAt,
        guestName,
        guestEmail,
      };

      await apiClient.bookings.create(booking);
      setSuccess(true);
      setSelectedSlot(null);
      setGuestName('');
      setGuestEmail('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при бронировании');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );
  }

  if (success) {
    return (
      <Center h={400}>
        <Stack align="center" gap="lg">
          <IconCheck size={64} color="#40c057" />
          <Title order={2}>Бронирование успешно!</Title>
          <Text c="dimmed">Мы отправили подтверждение на ваш email.</Text>
          <Button onClick={() => setSuccess(false)}>Забронировать ещё</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg" maw={600} mx="auto">
      <Group>
        <IconCalendarPlus size={32} />
        <Title order={2}>Забронировать время</Title>
      </Group>

      <Alert color="blue" variant="light">
        Выберите тип события и доступное время для бронирования
      </Alert>

      {eventTypes.length === 0 ? (
        <Card shadow="sm" padding="lg" withBorder>
          <Text c="dimmed" ta="center">Нет доступных типов событий для бронирования.</Text>
        </Card>
      ) : (
        <>
          <Card shadow="sm" padding="lg" withBorder>
            <Stack>
              <Select
                label="Тип события"
                placeholder="Выберите тип события"
                data={eventTypes.map(e => ({ value: e.id, label: `${e.title} (${e.durationMinutes} мин)` }))}
                value={selectedEventType}
                onChange={(val) => { setSelectedEventType(val); setSelectedSlot(null); }}
                required
              />
              
              {selectedEventType && (
                <Stack gap="xs">
                  <Text size="sm" fw={600}>Доступное время:</Text>
                  {availableSlotsForType.length === 0 ? (
                    <Text c="dimmed">Нет доступных слотов</Text>
                  ) : (
                    <SimpleGrid cols={3}>
                      {availableSlotsForType.slice(0, 12).map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedSlot === slot.id ? 'filled' : 'outline'}
                          size="xs"
                          onClick={() => setSelectedSlot(slot.id)}
                        >
                          {formatDateTime(slot.startAt)}
                        </Button>
                      ))}
                    </SimpleGrid>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" withBorder>
            <Stack>
              <Text size="lg" fw={600}>Информация о госте</Text>
              <TextInput
                label="Ваше имя"
                placeholder="Иван Иванов"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
              <TextInput
                label="Email"
                placeholder="ivan@example.com"
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
            </Stack>
          </Card>

          {error && (
            <Alert color="red" icon={<IconX size={16} />}>
              {error}
            </Alert>
          )}

          <Button 
            size="lg" 
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedEventType || !selectedSlot || !guestName || !guestEmail}
          >
            Забронировать
          </Button>
        </>
      )}
    </Stack>
  );
}
