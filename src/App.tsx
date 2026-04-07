import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/schedule/styles.css';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={{
          primaryColor: 'orange',
          defaultRadius: 'md',
          components: {
            Paper: {
              styles: {
                root: {
                  boxShadow: '0 4px 8px rgba(34, 197, 94, 0.15)',
                },
              },
            },
            Card: {
              styles: {
                root: {
                  boxShadow: '0 4px 8px rgba(34, 197, 94, 0.15)',
                },
              },
            },
          },
        }}
      >
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>
  );
}
