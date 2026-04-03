import { AppShell, Group, Title, NavLink, Text } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { 
  IconCalendarEvent, 
  IconClock, 
  IconCalendarCheck,
  IconLayoutDashboard,
  IconCalendarPlus
} from '@tabler/icons-react';

const navItems = [
  { label: 'Dashboard', icon: IconLayoutDashboard, path: '/' },
  { label: 'Типы событий', icon: IconCalendarEvent, path: '/event-types' },
  { label: 'Слоты', icon: IconClock, path: '/slots' },
  { label: 'Бронирования', icon: IconCalendarCheck, path: '/bookings' },
  { label: 'Бронирование (гость)', icon: IconCalendarPlus, path: '/book' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <IconCalendarEvent size={28} />
          <Title order={3}>Booking System</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            component={Link}
            to={item.path}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={location.pathname === item.path}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Text size="sm" c="dimmed" mb="md">
          {new Date().toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
