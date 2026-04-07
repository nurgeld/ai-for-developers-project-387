import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
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
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: 'light',
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
        globalStyles={() => ({
          html: {
            minHeight: '100%',
          },
          body: {
            minHeight: '100vh',
            backgroundColor: '#ffd9b3',
            backgroundImage:
              'linear-gradient(180deg, rgba(255, 190, 121, 0.85) 0%, rgba(255, 231, 198, 0.95) 45%, rgba(255, 244, 233, 1) 100%)',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            color: '#1f2937',
          },
          '#root': {
            minHeight: '100vh',
          },
        })}
      >
        <RouterProvider router={router} />
      </MantineProvider>
    </QueryClientProvider>
  );
}
