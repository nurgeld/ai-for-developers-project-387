import { Container, Title, Text, Button, Group, Paper, Stack, List, ThemeIcon, Badge } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { IconCalendarEvent, IconCheck, IconArrowRight } from '@tabler/icons-react';

export function HomePage() {
  return (
    <Container size="lg" py="xl">
      <Group align="flex-start" justify="space-between" wrap="wrap" gap="xl">
        <Stack gap="lg" maw={500}>
          <Badge
            size="lg"
            radius="xl"
            variant="light"
            color="orange"
            leftSection={<IconCalendarEvent size={14} />}
          >
            Быстрая запись на встречу
          </Badge>

          <Stack gap="xs">
            <Title order={1} size="3rem">Calendar</Title>
            <Text c="dimmed" size="lg">
              Забронируйте встречу за минуту: выберите тип события и удобное время.
            </Text>
          </Stack>

          <Button
            component={Link}
            to="/book"
            color="orange"
            size="lg"
            radius="md"
            rightSection={<IconArrowRight size={20} />}
            w="fit-content"
          >
            Записаться
          </Button>
        </Stack>

        <Paper withBorder p="xl" radius="md" maw={400} style={{ flex: '1 1 300px' }}>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="md" variant="light" color="orange">
                <IconCheck size={18} />
              </ThemeIcon>
              <Text fw={600} size="lg">Возможности</Text>
            </Group>

            <List spacing="sm" size="sm" c="dimmed" icon={
              <ThemeIcon size="sm" variant="light" color="orange">
                <IconCheck size={12} />
              </ThemeIcon>
            }>
              <List.Item>
                Выбор типа события и удобного времени для встречи
              </List.Item>
              <List.Item>
                Быстрое бронирование с подтверждением
              </List.Item>
              <List.Item>
                Управление типами встреч и просмотр записей в админке
              </List.Item>
            </List>
          </Stack>
        </Paper>
      </Group>
    </Container>
  );
}
