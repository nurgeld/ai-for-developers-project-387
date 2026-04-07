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
  Box,
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconAlertCircle } from '@tabler/icons-react';
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
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
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
      <Title order={2} mb="xl">Запись на встречу</Title>

      {step === 'calendar' ? (
        // 3-column layout for calendar step with equal height panels
        <Grid gap="lg">
          {/* Left column — summary */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            {settings && (
              <BookingSummary
                settings={settings}
                eventType={eventType}
                selectedDate={selectedDate}
                selectedSlot={calendarSelectedSlot}
              />
            )}
          </Grid.Col>

          {/* Center column — calendar */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper withBorder p="lg" radius="md" miw={350} mih={600}>
              <Stack gap="md" h="100%" justify="space-between">
                <Title order={4}>Выбрать дату</Title>
                <Box style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
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
                </Box>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Right column — slots with scroll and fixed buttons */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper
              withBorder
              p="lg"
              radius="md"
              mih={600}
              mah="calc(100vh - 180px)"
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
                <Title order={4}>Выбрать время</Title>
                {bookingError && (
                  <Group gap="xs">
                    <IconAlertCircle size={16} color="var(--mantine-color-red-5)" />
                    <Text c="red" size="sm">
                      {bookingError}
                    </Text>
                  </Group>
                )}
                <ScrollArea
                  style={{ flex: 1 }}
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
                  style={{ borderTop: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}
                >
                  <Button
                    variant="subtle"
                    color="gray"
                    leftSection={<IconArrowLeft size={16} />}
                    onClick={() => navigate({ to: '/book' })}
                  >
                    Назад
                  </Button>
                  <Button
                    color="orange"
                    disabled={!calendarSelectedSlot}
                    rightSection={<IconArrowRight size={16} />}
                    onClick={handleContinue}
                  >
                    Продолжить
                  </Button>
                </Group>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      ) : (
        // 2-column layout for form and success steps
        <Grid gap="lg">
          {/* Left column — summary */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            {settings && (
              <BookingSummary
                settings={settings}
                eventType={eventType}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
              />
            )}
          </Grid.Col>

          {/* Right columns — dynamic content */}
          <Grid.Col span={{ base: 12, md: 9 }}>
            {step === 'form' && selectedDate && selectedSlot && (
              <BookingForm
                onSubmit={handleSubmit}
                onBack={handleBack}
                isLoading={createBooking.isPending}
                error={bookingError}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
              />
            )}

            {step === 'success' && (
              <BookingSuccess onBookAnother={handleBookAnother} />
            )}
          </Grid.Col>
        </Grid>
      )}
    </Container>
  );
}
