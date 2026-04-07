import { Container, Title, Tabs, Stack, Group, ThemeIcon, Paper } from '@mantine/core';
import { IconList, IconCalendar, IconSettings } from '@tabler/icons-react';
import { BookingList } from '../components/admin/BookingList';
import { OwnerSettingsForm } from '../components/admin/OwnerSettingsForm';
import { EventTypeManager } from '../components/admin/EventTypeManager';
import { ScheduleView } from '../components/admin/ScheduleView';

export function AdminPage() {
  return (
    <Container size="lg" py="xl">
      <Group gap="xs" mb="xl">
        <ThemeIcon size="lg" variant="light" color="orange">
          <IconSettings size={24} />
        </ThemeIcon>
        <Title order={2}>Управление</Title>
      </Group>

      <Paper withBorder radius="md">
        <Tabs 
          defaultValue="bookings" 
          variant="outline"
          styles={{
            list: {
              borderBottom: 'none',
            },
            tab: {
              borderTop: '3px solid transparent',
              borderBottom: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              '&[data-active]': {
                borderTopColor: 'var(--mantine-color-orange-5)',
                borderBottom: 'none',
                backgroundColor: 'var(--mantine-color-orange-0)',
              },
            },
          }}
        >
          <Tabs.List p="xs">
            <Tabs.Tab value="bookings" leftSection={<IconList size={16} />}>
              Бронирования
            </Tabs.Tab>
            <Tabs.Tab value="schedule" leftSection={<IconCalendar size={16} />}>
              Расписание
            </Tabs.Tab>
            <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
              Настройки
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="bookings" p="lg">
            <BookingList />
          </Tabs.Panel>

          <Tabs.Panel value="schedule" p="lg">
            <ScheduleView />
          </Tabs.Panel>

          <Tabs.Panel value="settings" p="lg">
            <Stack gap="xl">
              <OwnerSettingsForm />
              <EventTypeManager />
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}
