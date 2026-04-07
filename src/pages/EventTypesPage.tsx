import { Container, Stack, Title, Text, SimpleGrid, Loader, Center, Group, ThemeIcon } from '@mantine/core';
import { IconCalendarEvent } from '@tabler/icons-react';
import { useOwnerSettings } from '../hooks/useOwnerSettings';
import { useEventTypes } from '../hooks/useEventTypes';
import { OwnerProfile } from '../components/booking/OwnerProfile';
import { EventTypeCard } from '../components/booking/EventTypeCard';

export function EventTypesPage() {
  const { data: settings, isLoading: settingsLoading } = useOwnerSettings();
  const { data: eventTypes, isLoading: typesLoading } = useEventTypes();

  if (settingsLoading || typesLoading) {
    return (
      <Center py="xl">
        <Loader color="orange" />
      </Center>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        {settings && <OwnerProfile settings={settings} />}

        <Stack gap="xs">
          <Group gap="xs">
            <ThemeIcon size="md" variant="light" color="orange">
              <IconCalendarEvent size={18} />
            </ThemeIcon>
            <Title order={2}>Выберите тип встречи</Title>
          </Group>
          <Text c="dimmed" size="sm">
            Нажмите на карточку, чтобы открыть календарь и выбрать удобный слот
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {eventTypes?.map((et) => (
            <EventTypeCard key={et.id} eventType={et} />
          ))}
        </SimpleGrid>

        {eventTypes?.length === 0 && (
          <Text c="dimmed" ta="center">Нет доступных типов событий</Text>
        )}
      </Stack>
    </Container>
  );
}
