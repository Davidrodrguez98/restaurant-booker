# Restaurant Booker - Technical Implementation Documentation

## 1. Project Overview

Restaurant Booker is a full-stack web application for managing restaurant table reservations. The target product allows users to browse restaurants, check table availability, create bookings, review their reservations, cancel bookings, save favourite restaurants, and leave reviews after visiting a restaurant.

This repository is based on the Turborepo `with-docker` boilerplate and has been adapted as the foundation for a technical test. The project is intentionally split into a frontend and a backend so each part can evolve independently while still sharing tooling, configuration, and packages inside one monorepo.

## 2. Main Technical Decisions

### Monorepo with Turborepo

The project uses Turborepo to manage multiple applications and shared packages in a single repository.

Reasons for this choice:

- The frontend and backend can be developed together while remaining clearly separated.
- Shared packages avoid duplicated configuration and utilities.
- Build, lint, and test tasks can be orchestrated from the root.
- Turborepo caching helps reduce repeated work in local development and CI.
- The structure is close to what many production teams use for multi-app JavaScript/TypeScript projects.

### Next.js for the Frontend

The frontend lives in `apps/web` and uses Next.js.

Reasons for this choice:

- It provides a modern React application structure.
- It supports server-side rendering, static rendering, and client-side interactivity.
- It is a strong fit for user-facing booking flows.
- It integrates well with TypeScript and shared workspace packages.
- It can be built as a standalone production artifact for Docker deployment.

### Express.js for the Backend API

The backend lives in `apps/api` and uses Express.js.

Reasons for this choice:

- Express is simple, mature, and widely understood.
- It is easy to expose REST endpoints consumed by the Next.js frontend.
- It keeps the API independent from the frontend framework.
- It is suitable for a technical test because the backend behavior is explicit and easy to review.
- It leaves room to add authentication, validation, persistence, and domain services without coupling them to Next.js.

Clarification: I would have used Next.js for both frontend and backend; however, given the context of the technical test, I understand that a separate backend and frontend are required, so I decided to use Express.js for the backend.

### Docker for Deployment

Both applications include Dockerfiles and the repository includes a `docker-compose.yml`.

Reasons for this choice:

- The frontend and backend can run in isolated containers.
- The deployment environment is closer to production.
- Docker Compose makes it easy to start both services together.
- Each app can be built independently using Turborepo pruning.

## 3. Repository Structure

```txt
.
├── apps
│   ├── api
│   │   ├── src
│   │   │   └── __tests__
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web
│       ├── src
│       │   └── app
│       ├── Dockerfile
│       └── package.json
├── packages
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## 4. Data modeling

Modelo de datos

## 5. Applications

### `apps/web`

The Next.js frontend application.

Current responsibilities:

- Enumerar aqui las features del front y las decisiones que se tomaron para implementarlas.

### `apps/api`

The Express backend application.

Current responsibilities:

- Start an HTTP server on port `3001` by default.
- Enumerar aqui las features del back y las decisiones que se tomaron para implementarlas.

Current endpoints:

```txt
GET /status
GET /message/:name
```

Expected future endpoints for the booking product:

```txt
GET    /restaurants
GET    /restaurants/:id
GET    /restaurants/:id/availability
POST   /bookings
GET    /bookings
GET    /bookings/:id
PATCH  /bookings/:id
DELETE /bookings/:id
POST   /restaurants/:id/reviews
POST   /restaurants/:id/favourites
DELETE /restaurants/:id/favourites
```

## 6. Local Development

### Requirements

- Node.js
- pnpm
- Docker and Docker Compose, for containerized execution

### Install Dependencies

```sh
pnpm install
```

### Start Development Mode

```sh
pnpm dev
```

This runs the Turborepo `dev` task for the workspace applications.

Expected local services:

```txt
Frontend: http://localhost:3000
API:      http://localhost:3001
```

### Run Only the Frontend

```sh
pnpm --filter web dev
```

### Run Only the API

```sh
pnpm --filter api dev
```

### API Environment Variable Used by the Frontend

The frontend uses:

```txt
NEXT_PUBLIC_API_HOST
```

Example:

```sh
NEXT_PUBLIC_API_HOST=http://localhost:3001 pnpm --filter web dev
```

When not defined, the frontend falls back to:

```txt
http://localhost:3001
```

## 7. Build, Lint, and Test

### Build Everything

```sh
pnpm build
```

This runs:

```sh
turbo run build
```

### Lint Everything

```sh
pnpm lint
```

This runs:

```sh
turbo run lint
```

### Test Everything

```sh
pnpm test
```

This runs:

```sh
turbo run test
```

### API Tests

The API currently includes Jest coverage for:

- `GET /status`
- `GET /message/:name`
- Enumerar los tests implementados

## 8. Docker Deployment

The repository includes one Dockerfile for the frontend and one for the backend.

```txt
apps/web/Dockerfile
apps/api/Dockerfile
```

The Compose file exposes:

```txt
web -> 3000
api -> 3001
```

### Create the Docker Network

The current `docker-compose.yml` expects an external network named `app_network`.

```sh
docker network create app_network
```

### Build the Containers

```sh
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose -f docker-compose.yml build
```

### Start the Containers

```sh
docker-compose -f docker-compose.yml up -d
```

### Stop the Containers

```sh
docker-compose -f docker-compose.yml down
```

### Production URLs

When running with Docker Compose locally:

```txt
Frontend: http://localhost:3000
API:      http://localhost:3001
```

## 10. Backend Architecture

As the API grows, avoid placing all logic directly inside Express route handlers. A maintainable structure would be:

```txt
apps/api/src
├── index.ts
├── server.ts
├── routes
│   ├── restaurants.routes.ts
│   ├── bookings.routes.ts
│   └── reviews.routes.ts
├── services
│   ├── restaurants.service.ts
│   ├── bookings.service.ts
│   └── availability.service.ts
├── repositories
│   ├── restaurants.repository.ts
│   ├── bookings.repository.ts
│   └── tables.repository.ts
├── schemas
│   ├── bookings.schema.ts
│   └── restaurants.schema.ts
└── errors
    └── http-error.ts
```

Recommended responsibilities:

- Routes handle HTTP input and output.
- Schemas validate request payloads and query parameters.
- Services contain business rules.
- Repositories isolate persistence.
- Errors provide consistent API responses.

## 11. Booking Logic Considerations

The most important part of the project is the booking flow. A good implementation should handle:

- A booking cannot be created for a past date or time.
- A booking party size must be greater than zero.
- A table must have enough capacity for the party size.
- A table cannot be double-booked for overlapping time slots.
- Cancelled bookings should no longer block availability.
- Availability should be calculated from restaurant opening hours, table capacity, and existing bookings.
- Error messages should be useful but should not expose internal details.

For a production system, the booking creation should be protected by database constraints or transactions to prevent race conditions when two users book the same table at the same time.

## 12. Suggested Frontend Pages

The Next.js frontend can be organized around the main user journey.

Suggested pages:

```txt
/
/restaurants
/restaurants/[id]
/restaurants/[id]/book
/bookings
/bookings/[id]
/favourites
```

Suggested user flow:

```txt
Restaurant list
  -> Restaurant detail
  -> Select date, time, and party size
  -> Confirm booking
  -> Booking confirmation
```

## 13. Validation and Error Handling

Recommended validation approach:

- Validate all API input before it reaches service logic.
- Return `400` for invalid input.
- Return `404` when a restaurant, table, or booking does not exist.
- Return `409` when a table is no longer available.
- Return `500` only for unexpected server errors.

Recommended API error shape:

```json
{
	"error": {
		"code": "BOOKING_CONFLICT",
		"message": "The selected table is no longer available."
	}
}
```

## 14. Testing Strategy

### Backend Tests

Recommended tests:

- Health endpoint returns success.
- Restaurant list endpoint returns expected data.
- Booking creation validates required fields.
- Booking creation rejects past dates.
- Booking creation rejects unavailable tables.
- Booking cancellation updates availability.
- API returns consistent error responses.

### Frontend Tests

Recommended tests:

- Restaurant list renders.
- Restaurant detail page renders.
- Booking form validates required fields.
- Booking form handles API errors.
- Successful booking shows confirmation.

### End-to-End Tests

Recommended E2E flow:

```txt
Open restaurant list
Select a restaurant
Choose date and party size
Select an available time
Create booking
View confirmation
Cancel booking
Confirm availability is restored
```

## 15. Future improvements

- Email notifications for booking confirmations and cancellations.
- Online payment integration for booking deposits.
- Admin panel for restaurant owners to manage availability and view bookings.
- Pagination for restaurant list and booking history.
- Filtering and sorting options for restaurants (e.g., by cuisine, rating, distance).
- When app is deployed, a static IP must be configured and included in a white list in the database configuration.
