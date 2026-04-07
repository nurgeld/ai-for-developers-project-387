import { useState } from 'react';
import { Stack, Text, Loader, Center, Paper, ThemeIcon } from '@mantine/core';
import { IconCalendarOff } from '@tabler/icons-react';
import { useOwnerBookings } from '../../hooks/useOwnerBookings';
import { useCancelBooking } from '../../hooks/useCancelBooking';
import { BookingCard } from './BookingCard';

export function BookingList() {
  const { data: bookings, isLoading, error } = useOwnerBookings();
  const cancelMutation = useCancelBooking();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки бронирований';

  if (isLoading && !bookings) {
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
  }

  if (error && !bookings) {
    return <Text c="red">{errorMessage}</Text>;
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Paper withBorder p="xl" radius="md">
        <Stack align="center" gap="md">
          <ThemeIcon size="xl" variant="light" color="gray">
            <IconCalendarOff size={32} />
          </ThemeIcon>
          <Text c="dimmed" ta="center">Нет предстоящих событий</Text>
        </Stack>
      </Paper>
    );
  }

  function handleCancel(id: string) {
    setCancellingId(id);
    cancelMutation.mutate(id, {
      onSettled: () => setCancellingId(null),
    });
  }

  return (
    <Stack gap="md">
      {error && (
        <Text c="orange" size="sm">
          Не удалось обновить список бронирований. Показаны последние доступные данные.
        </Text>
      )}
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onCancel={handleCancel}
          isCancelling={cancellingId === booking.id}
        />
      ))}
    </Stack>
  );
}
