import { Stack, Text, Button, Paper } from '@mantine/core';

interface BookingSuccessProps {
  onBookAnother: () => void;
}

export function BookingSuccess({ onBookAnother }: BookingSuccessProps) {
  return (
    <Paper withBorder shadow="sm" p="xl" radius="md">
      <Stack gap="lg" align="center">
        <Text fw={700} size="xl" ta="center">
          Бронь подтверждена. До встречи!
        </Text>

        <Button
          color="orange"
          size="lg"
          fullWidth
          onClick={onBookAnother}
        >
          Забронировать еще
        </Button>
      </Stack>
    </Paper>
  );
}
