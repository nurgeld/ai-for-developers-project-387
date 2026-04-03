import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { EventTypes } from './pages/EventTypes';
import { Availability } from './pages/Availability';
import { Slots } from './pages/Slots';
import { Bookings } from './pages/Bookings';
import { GuestBooking } from './pages/GuestBooking';

export default function App() {
  return (
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Outlet /></Layout>}>
            <Route index element={<Dashboard />} />
            <Route path="event-types" element={<EventTypes />} />
            <Route path="event-types/:id/availability" element={<Availability />} />
            <Route path="slots" element={<Slots />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="book" element={<GuestBooking />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
