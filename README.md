# Booking System

A calendar-based booking application for event scheduling. The system supports two roles: calendar owner and guests.

## Overview

**Calendar Owner** can:
- Create event types (e.g., "Знакомство" — 15 min, "Консультация" — 30 min)
- View upcoming bookings across all event types
- Configure availability: days of the week and time ranges (e.g., 9:00–12:00, 14:00–19:00)
- Filter bookings by event type, date range, and status

**Guests** can:
- Browse available event types with name, description, and duration
- View a calendar with available (gray), booked (red), and personal (green) slots
- Book a free slot by providing name, email, and optional comment (max 500 chars)
- Navigate the calendar up to 4 weeks ahead (day or week view)

## Key Rules

- **No overlap**: Two bookings cannot occupy the same time slot, even for different event types
- **Buffer time**: After a 30-minute booking, subsequent free slots shift forward by +10 minutes
- **No registration**: Guests book without creating an account; personal slot highlighting is managed via cookies on the frontend
- **Slot generation**: Slots are generated as a 30-minute grid within configured availability periods, spanning 4 weeks ahead

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Mantine UI, React Router
- **Backend**: Python, FastAPI, Pydantic, Poetry
- **API Contract**: TypeSpec (`api/main.tsp`)

## Getting Started

### Frontend

```bash
npm install
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Backend

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

## API

The API contract is defined in `api/main.tsp` using TypeSpec. Generated TypeScript types are available in `src/api/types.ts`.

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/event-types` | Create an event type |
| GET | `/event-types` | List all event types |
| GET | `/slots` | List available and booked slots |
| POST | `/bookings` | Create a booking |
| GET | `/bookings` | List bookings with filters |
| POST | `/availability` | Create an availability period |
| GET | `/availability` | List availability periods |

## Project Structure

```
src/
├── api/          # API client and types
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── pages/        # Page components (route components)
└── utils/        # Utility functions

backend/
└── app/
    ├── main.py       # FastAPI application entry point
    ├── models.py     # Pydantic models
    └── routers/      # API route handlers
```