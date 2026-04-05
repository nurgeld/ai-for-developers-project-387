import { useEffect } from 'react';
import { Stack, TextInput, Button, Text, Loader, Center } from '@mantine/core';
import { useForm } from '@mantine/form';
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
    return <Center py="xl"><Loader /></Center>;
  }

  return (
    <form onSubmit={form.onSubmit((values) => updateMutation.mutate(values))}>
      <Stack gap="md">
        <Text fw={600} size="lg">Настройки профиля</Text>

        <TextInput
          label="Имя"
          placeholder="Имя владельца"
          required
          {...form.getInputProps('name')}
        />
        <TextInput
          label="URL аватара"
          placeholder="https://example.com/avatar.png"
          {...form.getInputProps('avatarUrl')}
        />
        <TextInput
          label="Начало рабочего дня"
          placeholder="09:00"
          required
          {...form.getInputProps('workDayStart')}
        />
        <TextInput
          label="Конец рабочего дня"
          placeholder="18:00"
          required
          {...form.getInputProps('workDayEnd')}
        />

        {errorMessage && <Text c="red" size="sm">{errorMessage}</Text>}
        {errorDetails.map((detail) => (
          <Text key={detail} c="red" size="sm">{detail}</Text>
        ))}
        {updateMutation.isSuccess && (
          <Text c="green" size="sm">Сохранено</Text>
        )}

        <Button
          type="submit"
          color="orange"
          loading={updateMutation.isPending}
        >
          Сохранить
        </Button>
      </Stack>
    </form>
  );
}
