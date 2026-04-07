import { useEffect } from 'react';
import { Stack, TextInput, Button, Text, Loader, Center, Paper, Group, Title, ThemeIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser, IconPhoto, IconClock, IconCheck } from '@tabler/icons-react';
import { useOwnerSettings } from '../../hooks/useOwnerSettings';
import { useUpdateSettings } from '../../hooks/useUpdateSettings';
import { ApiError } from '../../api/client';

interface ValidationErrorPayload {
  message?: string;
  details?: string[];
}

export function OwnerSettingsForm() {
  const { data: settings, isLoading } = useOwnerSettings();
  const updateMutation = useUpdateSettings();

  const form = useForm({
    initialValues: {
      name: '',
      avatarUrl: '',
      workDayStart: '09:00',
      workDayEnd: '18:00',
    },
    validate: {
      name: (v) => (v.trim().length < 1 ? 'Обязательное поле' : null),
      workDayStart: (v) =>
        /^\d{2}:\d{2}$/.test(v) ? null : 'Формат HH:mm',
      workDayEnd: (v) =>
        /^\d{2}:\d{2}$/.test(v) ? null : 'Формат HH:mm',
    },
  });

  useEffect(() => {
    if (settings) {
      form.setValues({
        name: settings.name,
        avatarUrl: settings.avatarUrl ?? '',
        workDayStart: settings.workDayStart,
        workDayEnd: settings.workDayEnd,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const errorPayload = updateMutation.error instanceof ApiError
    ? updateMutation.error.data as ValidationErrorPayload
    : null;
  const errorMessage = errorPayload?.message ?? (updateMutation.isError ? 'Ошибка сохранения' : null);
  const errorDetails = errorPayload?.details ?? [];

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
  }

  return (
    <Paper withBorder p="xl" radius="md">
      <form onSubmit={form.onSubmit((values) => updateMutation.mutate(values))}>
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon size="md" variant="light" color="orange">
              <IconUser size={18} />
            </ThemeIcon>
            <Title order={4}>Настройки профиля</Title>
          </Group>

          <TextInput
            label="Имя"
            placeholder="Имя владельца"
            required
            leftSection={<IconUser size={16} />}
            {...form.getInputProps('name')}
          />
          <TextInput
            label="URL аватара"
            placeholder="https://example.com/avatar.png"
            leftSection={<IconPhoto size={16} />}
            {...form.getInputProps('avatarUrl')}
          />

          <Group grow>
            <TextInput
              label="Начало рабочего дня"
              placeholder="09:00"
              required
              leftSection={<IconClock size={16} />}
              {...form.getInputProps('workDayStart')}
            />
            <TextInput
              label="Конец рабочего дня"
              placeholder="18:00"
              required
              leftSection={<IconClock size={16} />}
              {...form.getInputProps('workDayEnd')}
            />
          </Group>

          {errorMessage && <Text c="red" size="sm">{errorMessage}</Text>}
          {errorDetails.map((detail) => (
            <Text key={detail} c="red" size="sm">{detail}</Text>
          ))}
          {updateMutation.isSuccess && (
            <Group gap="xs">
              <IconCheck size={16} color="var(--mantine-color-green-5)" />
              <Text c="green" size="sm">Сохранено</Text>
            </Group>
          )}

          <Button
            type="submit"
            color="orange"
            leftSection={<IconCheck size={16} />}
            loading={updateMutation.isPending}
          >
            Сохранить
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
