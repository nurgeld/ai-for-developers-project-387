import { Group, Avatar, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconUser } from '@tabler/icons-react';
import type { OwnerSettings } from '../../api/types';

interface OwnerProfileProps {
  settings: OwnerSettings;
}

export function OwnerProfile({ settings }: OwnerProfileProps) {
  return (
    <Group gap="sm">
      <Avatar
        src={settings.avatarUrl}
        size="lg"
        radius="xl"
        color="orange"
        variant="light"
      >
        {settings.avatarUrl ? null : (
          <ThemeIcon size="lg" variant="light" color="orange" radius="xl">
            <IconUser size={24} />
          </ThemeIcon>
        )}
      </Avatar>
      <Stack gap={0}>
        <Text fw={600}>{settings.name}</Text>
        <Text size="sm" c="dimmed">Организатор</Text>
      </Stack>
    </Group>
  );
}
