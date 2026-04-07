import { Group, Text, UnstyledButton, Box, rem } from '@mantine/core';
import { Link, useMatchRoute } from '@tanstack/react-router';
import { IconCalendarEvent, IconSettings } from '@tabler/icons-react';

export function Header() {
  const matchRoute = useMatchRoute();
  const isBook = matchRoute({ to: '/book', fuzzy: true });
  const isAdmin = matchRoute({ to: '/admin', fuzzy: true });

  const tabs = [
    { path: '/book', label: 'Записаться', icon: IconCalendarEvent, active: isBook },
    { path: '/admin', label: 'Управление', icon: IconSettings, active: isAdmin },
  ];

  return (
    <Box h="100%">
      <Group h="100%" px="md" justify="space-between" wrap="nowrap">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Group gap={8}>
            <IconCalendarEvent size={28} color="var(--mantine-color-orange-5)" />
            <Text size="lg" fw={700} c="dark">
              Calendar
            </Text>
          </Group>
        </Link>

        <Group gap={4} wrap="nowrap">
          {tabs.map((tab) => (
            <UnstyledButton
              key={tab.path}
              component={Link}
              to={tab.path}
              style={{
                padding: `${rem(8)} ${rem(16)}`,
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: tab.active
                  ? 'var(--mantine-color-orange-0)'
                  : 'transparent',
                color: tab.active
                  ? 'var(--mantine-color-orange-5)'
                  : 'var(--mantine-color-gray-6)',
                transition: 'all 150ms ease',
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: tab.active
                      ? 'var(--mantine-color-orange-0)'
                      : 'var(--mantine-color-gray-0)',
                    color: tab.active
                      ? 'var(--mantine-color-orange-6)'
                      : 'var(--mantine-color-gray-8)',
                  },
                },
              }}
            >
              <Group gap={6} wrap="nowrap">
                <tab.icon size={18} />
                <Text size="sm" fw={500}>
                  {tab.label}
                </Text>
              </Group>
            </UnstyledButton>
          ))}
        </Group>
      </Group>
    </Box>
  );
}
