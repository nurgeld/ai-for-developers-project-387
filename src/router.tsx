import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { AppShell } from '@mantine/core';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { EventTypesPage } from './pages/EventTypesPage';
import { BookingPage } from './pages/BookingPage';
import { AdminPage } from './pages/AdminPage';

// Root layout
const rootRoute = createRootRoute({
  component: () => (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      styles={{
        root: {
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #d4edda 0%, #f0f9f0 45%, #ffffff 100%)',
        },
        header: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        },
        main: { backgroundColor: 'transparent' },
      }}
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
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
