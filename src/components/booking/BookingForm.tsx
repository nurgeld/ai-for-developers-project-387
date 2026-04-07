import { Stack, TextInput, Button, Text, Paper, Group, Title, ThemeIcon, Card, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser, IconMail, IconArrowLeft, IconCheck, IconCalendar, IconClock } from '@tabler/icons-react';
import type { Slot } from '../../api/types';
import { dayjs } from '../../lib/dayjs';

interface BookingFormProps {
  onSubmit: (values: { guestName: string; guestEmail: string }) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  selectedDate: Date;
  selectedSlot: Slot;
}

export function BookingForm({ onSubmit, onBack, isLoading, error, selectedDate, selectedSlot }: BookingFormProps) {
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

  const formattedDate = dayjs(selectedDate).format('D MMMM YYYY');
  const formattedTime = `${dayjs.utc(selectedSlot.startAt).format('HH:mm')} - ${dayjs.utc(selectedSlot.endAt).format('HH:mm')}`;

  return (
    <Paper withBorder p="xl" radius="md">
      <Stack gap="lg">
        <Group gap="xs">
          <ThemeIcon size="md" variant="light" color="orange">
            <IconUser size={18} />
          </ThemeIcon>
          <Title order={4}>Подтверждение записи</Title>
        </Group>

        {/* Selected date and time info */}
        <Card withBorder p="md" radius="md" bg="orange.0">
          <Group gap="md" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size="sm" variant="light" color="orange">
                <IconCalendar size={14} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Дата</Text>
                <Text fw={600}>{formattedDate}</Text>
              </Stack>
            </Group>
            
            <Divider orientation="vertical" />
            
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size="sm" variant="light" color="orange">
                <IconClock size={14} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text size="xs" c="dimmed">Время</Text>
                <Text fw={600}>{formattedTime}</Text>
              </Stack>
            </Group>
          </Group>
        </Card>

        <form onSubmit={form.onSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Имя"
              placeholder="Введите ваше имя"
              required
              leftSection={<IconUser size={16} />}
              {...form.getInputProps('guestName')}
            />
            <TextInput
              label="Электронная почта"
              placeholder="your@email.com"
              type="email"
              required
              leftSection={<IconMail size={16} />}
              {...form.getInputProps('guestEmail')}
            />

            {error && (
              <Text c="red" size="sm" fw={500}>{error}</Text>
            )}

            <Group grow mt="md">
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconArrowLeft size={16} />}
                onClick={onBack}
              >
                Назад
              </Button>
              <Button
                type="submit"
                color="orange"
                leftSection={<IconCheck size={16} />}
                loading={isLoading}
              >
                Подтвердить
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Paper>
  );
}
