import { useState, useMemo, useCallback } from 'react';
import {
  Container,
  Grid,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Button,
  Loader,
  Center,
  ScrollArea,
} from '@mantine/core';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useOwnerSettings } from '../hooks/useOwnerSettings';
import { useEventTypes } from '../hooks/useEventTypes';
import { useSlots } from '../hooks/useSlots';
import { useCreateBooking } from '../hooks/useCreateBooking';
import { BookingSummary } from '../components/booking/BookingSummary';
import { SlotCalendar } from '../components/booking/SlotCalendar';
import { SlotList } from '../components/booking/SlotList';
import { BookingForm } from '../components/booking/BookingForm';
import { BookingSuccess } from '../components/booking/BookingSuccess';
import { ApiError } from '../api/client';
import type { Slot } from '../api/types';
import { dayjs } from '../lib/dayjs';

type Step = 'calendar' | 'form' | 'success';

interface BookingPageProps {
  eventTypeId: string;
}

export function BookingPage({ eventTypeId }: BookingPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: settings, isLoading: settingsLoading } = useOwnerSettings();
  const { data: eventTypes, isLoading: typesLoading } = useEventTypes();

  const eventType = eventTypes?.find((et) => et.id === eventTypeId);

  const [step, setStep] = useState<Step>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month').toDate());
  const [bookingError, setBookingError] = useState<string | null>(null);

  const createBooking = useCreateBooking();

  // Month range for slot counters - dynamic based on current month view
  const monthStart = dayjs(currentMonth).startOf('month').format('YYYY-MM-DD');
  const monthEnd = dayjs(currentMonth).endOf('month').format('YYYY-MM-DD');

  const { data: monthSlots } = useSlots(eventTypeId, monthStart, monthEnd);

  const visibleDaySlots = useMemo(() => {
    if (!selectedDate || !monthSlots) return [];

    const selectedDay = dayjs(selectedDate).format('YYYY-MM-DD');
    const now = dayjs();

    return monthSlots.filter(
      (slot) => {
        const slotDay = dayjs.utc(slot.startAt).format('YYYY-MM-DD');
        if (slotDay !== selectedDay) {
          return false;
        }
        return dayjs.utc(slot.startAt).isAfter(now);
      },
    );
  }, [monthSlots, selectedDate]);

  const freeCount = useMemo(() => {
    return visibleDaySlots.filter((slot) => !slot.isBooked).length;
  }, [visibleDaySlots]);

  const totalCount = visibleDaySlots.length;

  const calendarSelectedSlot = useMemo(() => {
    if (!selectedSlot) {
      return null;
    }

    const slotStillAvailable = visibleDaySlots.find(
      (slot) => slot.startAt === selectedSlot.startAt && !slot.isBooked,
    );

    if (!slotStillAvailable) {
      return null;
    }

    return selectedSlot;
  }, [visibleDaySlots, selectedSlot]);

  const handleSlotSelect = useCallback((slot: Slot) => {
    if (!slot.isBooked) {
      setBookingError(null);
      setSelectedSlot(slot);
    }
  }, []);

  const refetchSlots = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['slots', eventTypeId, monthStart, monthEnd],
    });
    // Return current monthSlots after invalidation
    return { data: monthSlots };
  }, [queryClient, eventTypeId, monthStart, monthEnd, monthSlots]);

  const handleContinue = useCallback(async () => {
    if (!calendarSelectedSlot || !selectedDate || !selectedSlot) {
      return;
    }

    setBookingError(null);

    let fetched;

    try {
      fetched = await refetchSlots();
    } catch {
      setBookingError('Не удалось обновить доступные слоты. Попробуйте еще раз.');
      return;
    }

    const latestSlots = fetched.data ?? monthSlots ?? [];
    const selectedDay = dayjs(selectedDate).format('YYYY-MM-DD');
    const latestDaySlots = latestSlots.filter(
      (slot: Slot) => dayjs.utc(slot.startAt).format('YYYY-MM-DD') === selectedDay,
    );

    const stillFree = latestDaySlots.some(
      (slot: Slot) => slot.startAt === selectedSlot.startAt && !slot.isBooked,
    );

    if (!stillFree) {
      setSelectedSlot(null);
      setBookingError('Выбранный слот уже занят. Выберите другое время.');
      return;
    }

    setStep('form');
  }, [calendarSelectedSlot, monthSlots, refetchSlots, selectedDate, selectedSlot]);

  const handleBack = useCallback(() => {
    setStep('calendar');
    setBookingError(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: { guestName: string; guestEmail: string }) => {
      if (!selectedSlot || !selectedDate) {
        return;
      }

      setBookingError(null);

      let latest;

      try {
        latest = (await refetchSlots()).data;
      } catch {
        setBookingError('Не удалось проверить доступность слота. Попробуйте еще раз.');
        return;
      }

      const latestList = latest ?? monthSlots ?? [];
      const selectedDay = dayjs(selectedDate).format('YYYY-MM-DD');
      const latestDaySlots = latestList.filter(
        (slot: Slot) => dayjs.utc(slot.startAt).format('YYYY-MM-DD') === selectedDay,
      );
      const liveSlot = latestDaySlots.find(
        (slot: Slot) => slot.startAt === selectedSlot.startAt && !slot.isBooked,
      );

      if (!liveSlot) {
        setSelectedSlot(null);
        setStep('calendar');
        setBookingError('Выбранный слот уже занят. Выберите другое время.');
        return;
      }

      createBooking.mutate(
        {
          eventTypeId,
          guestName: values.guestName,
          guestEmail: values.guestEmail,
          startAt: liveSlot.startAt,
        },
        {
          onSuccess: () => setStep('success'),
          onError: (err) => {
            if (err instanceof ApiError) {
              if ((err.data as { error?: string })?.error === 'SLOT_ALREADY_BOOKED') {
                setSelectedSlot(null);
                setStep('calendar');
                void queryClient.invalidateQueries({ queryKey: ['slots'] });
              }

              setBookingError(
                (err.data as { message?: string })?.message ?? err.message,
              );
            } else {
              setBookingError('Произошла ошибка при создании бронирования');
            }
          },
        },
      );
    },
    [
      monthSlots,
      eventTypeId,
      refetchSlots,
      queryClient,
      selectedDate,
      selectedSlot,
      createBooking,
    ],
  );

  const handleBookAnother = useCallback(() => {
    navigate({ to: '/book' });
  }, [navigate]);

  if (settingsLoading || typesLoading) {
    return <Center py="xl"><Loader /></Center>;
  }

  if (!eventType) {
    return (
      <Container size="lg" py="xl">
        <Text c="red">Тип события не найден</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Title order={2} mb="lg">Запись на звонок</Title>

      <Grid gutter="lg" align={step === 'calendar' ? 'stretch' : 'flex-start'}>
        {/* Left column — summary */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          {settings && (
            <BookingSummary
              settings={settings}
              eventType={eventType}
              selectedDate={selectedDate}
              selectedSlot={step === 'calendar' ? calendarSelectedSlot : selectedSlot}
              freeCount={freeCount}
              totalCount={totalCount}
            />
          )}
        </Grid.Col>

        {/* Center column — calendar (only in calendar step) */}
        {step === 'calendar' && (
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper withBorder shadow="sm" p="lg" radius="md">
              <Stack gap="md">
                <Title order={4}>Календарь</Title>
                <SlotCalendar
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                    setBookingError(null);
                  }}
                  monthSlots={monthSlots ?? []}
                  onMonthChange={setCurrentMonth}
                />
              </Stack>
            </Paper>
          </Grid.Col>
        )}

        {/* Right column — dynamic content */}
        <Grid.Col
          span={{ base: 12, md: step === 'calendar' ? 4 : 9 }}
          style={{
            minHeight: 0,
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {step === 'calendar' && (
            <Paper
              withBorder
              shadow="sm"
              p="lg"
              radius="md"
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <Stack gap="md" style={{ minHeight: 0, flex: 1 }}>
                <Title order={4}>Статус слотов</Title>
                {bookingError && (
                  <Text c="red" size="sm">
                    {bookingError}
                  </Text>
                )}
                <ScrollArea
                  style={{ flex: 1, minHeight: 0 }}
                  offsetScrollbars
                  scrollbarSize={6}
                >
                  <SlotList
                    slots={visibleDaySlots}
                    selectedSlot={calendarSelectedSlot}
                    onSelect={handleSlotSelect}
                  />
                </ScrollArea>
                <Group
                  justify="space-between"
                  pt="md"
                  style={{ flexShrink: 0 }}
                >
                  <Button
                    variant="outline"
                    color="gray"
                    onClick={() => navigate({ to: '/book' })}
                  >
                    Назад
                  </Button>
                  <Button
                    color="orange"
                    disabled={!calendarSelectedSlot}
                    onClick={handleContinue}
                  >
                    Продолжить
                  </Button>
                </Group>
              </Stack>
            </Paper>
          )}

          {step === 'form' && (
            <ScrollArea style={{ maxHeight: '75vh' }}>
              <BookingForm
                onSubmit={handleSubmit}
                onBack={handleBack}
                isLoading={createBooking.isPending}
                error={bookingError}
              />
            </ScrollArea>
          )}

          {step === 'success' && (
            <ScrollArea style={{ maxHeight: '75vh' }}>
              <BookingSuccess onBookAnother={handleBookAnother} />
            </ScrollArea>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
}
