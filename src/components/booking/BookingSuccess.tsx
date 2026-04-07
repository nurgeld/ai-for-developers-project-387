import { Stack, Text, Button, Paper, Title, ThemeIcon } from '@mantine/core';
import { IconCircleCheck, IconCalendarPlus } from '@tabler/icons-react';

interface BookingSuccessProps {
  onBookAnother: () => void;
}

export function BookingSuccess({ onBookAnother }: BookingSuccessProps) {
  return (
    <Paper withBorder p="xl" radius="md">
      <Stack gap="xl" align="center">
        <ThemeIcon size={80} variant="light" color="green" radius="xl">
          <IconCircleCheck size={48} />
        </ThemeIcon>

        <Stack gap="xs" align="center">
          <Title order={3} ta="center">
            Бронь подтверждена!
          </Title>
          <Text c="dimmed" ta="center" size="lg">
            До встречи!
          </Text>
        </Stack>

        <Button
          color="orange"
          size="lg"
          leftSection={<IconCalendarPlus size={20} />}
          onClick={onBookAnother}
        >
          Забронировать еще
        </Button>
      </Stack>
    </Paper>
  );
}
