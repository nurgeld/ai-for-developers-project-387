import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { AppShell, Box } from '@mantine/core';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { EventTypesPage } from './pages/EventTypesPage';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <Box
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #e2e8f0 0%, #f1f5f9 50%, #f8fafc 100%)',
      }}
    >
      <AppShell
        header={{ height: 60 }}
        padding="md"
        styles={{
          root: {
            backgroundColor: 'transparent',
            minHeight: '100vh',
          },
          header: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid var(--mantine-color-gray-3)',
          },
          main: {
            backgroundColor: 'transparent',
            paddingTop: 'calc(var(--mantine-spacing-md) + 60px)',
          },
        }}
      >
        <AppShell.Header>
          <Header />
        </AppShell.Header>
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </Box>
  ),
});

// Routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/book',
});

const bookIndexRoute = createRoute({
  getParentRoute: () => bookRoute,
  path: '/',
  component: EventTypesPage,
});

const bookEventTypeRoute = createRoute({
  getParentRoute: () => bookRoute,
  path: '/$eventTypeId',
  component: () => {
    const { eventTypeId } = bookEventTypeRoute.useParams();
    return <BookingPage eventTypeId={eventTypeId} />;
  },
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
});

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  bookRoute.addChildren([bookIndexRoute, bookEventTypeRoute]),
  adminRoute,
]);

// Router
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
