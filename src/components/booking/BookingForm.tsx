import { Stack, TextInput, Button, Text, Paper } from '@mantine/core';
import { useForm } from '@mantine/form';

interface BookingFormProps {
  onSubmit: (values: { guestName: string; guestEmail: string }) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function BookingForm({ onSubmit, onBack, isLoading, error }: BookingFormProps) {
  const form = useForm({
    initialValues: {
      guestName: '',
      guestEmail: '',
    },
    validate: {
      guestName: (v) =>
        v.trim().length < 2 ? 'Минимум 2 символа' : null,
      guestEmail: (v) =>
        /^\S+@\S+\.\S+$/.test(v) ? null : 'Некорректный email',
    },
    validateInputOnChange: true,
  });

  return (
    <Paper withBorder shadow="sm" p="lg" radius="md">
      <Stack gap="md">
        <Text fw={600} size="lg">Подтверждение записи</Text>

        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Имя"
              placeholder="Имя"
              required
              {...form.getInputProps('guestName')}
            />
            <TextInput
              label="Электронная почта"
              placeholder="Email"
              type="email"
              required
              {...form.getInputProps('guestEmail')}
            />

            {error && (
              <Text c="red" size="sm">{error}</Text>
            )}

            <Button
              type="submit"
              color="orange"
              fullWidth
              loading={isLoading}
            >
              Подтвердить запись
            </Button>

            <Button
              variant="outline"
              color="gray"
              fullWidth
              onClick={onBack}
            >
              Изменить
            </Button>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
