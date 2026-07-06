# Restaurant Booker App

## Description

This is a Restaurant Booker App design to allow people to book a table at their favorite restaurant. The app frontend is built using Next.js, and the backend is built using Node.js and Express.js. The app allows users to view available restaurants, select a restaurant, choose a date and time, and book a table. Users can also view their booking history and cancel bookings if needed. Users can also leave reviews for restaurants they have visited and manage favourites restaurants. The app is designed to be user-friendly and responsive, making it easy for users to book a table from their desktop or mobile device.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AI usage

- Ayudar a elegir las tecnologías adeacuadas para el proyecto.
- Ayudar a cambiar yarn por pnpm en boilerplate de turborepo con docker y resolver errores de este cambio.
- boilerplate express y next turborepo con docker, better auth, drizzle, supabase y tailwindcss.
- Arreglar pequeños bugs al generar migraciones de better-auth con drizzle, como la definición de relaciones de la forma v2 de drizzle.
- Arreglar bug de dependencias circulares con relaciones de drizzle al estar en distintos archivos.
- Construir repositorios y servicios base para las entidades de la app, como restaurant, reservation, comment, etc.
- Output rechazado de la IA: Código repetitivo que le dije que lo extraiga a una función aparte.
- mejorar organizacion de archivos y carpetas, como separar lógica de comentarios y de restaurantes.

## Cosas útiles

- boilerplate express y next turborepo con docker https://github.com/vercel/turborepo/tree/main/examples/with-docker
- Flujo de autenticación con better-auth y drizzle:
  - Front llama a api POST /api/auth/sign-in/email con email y password.
  - Backend llama a better-auth para validar credenciales y generar un token JWT que devuelve al frontend.
  - Frontend guarda el token JWT en localStorage y lo envía en la cabecera Authorization de las siguientes peticiones a la API.
  - Backend valida el token JWT en cada petición y obtiene el usuario autenticado.
-

# Turborepo Docker starter

This is a community-maintained example. If you experience a problem, please submit a pull request with a fix. GitHub Issues will be closed.

## Using this example

Run the following command:

```sh
npx create-turbo@latest -e with-docker
```

## What's inside?

This Turborepo includes the following:

### Apps and Packages

- `web`: a [Next.js](https://nextjs.org/) app
- `api`: an [Express](https://expressjs.com/) server
- `@repo/ui`: a React component library
- `@repo/logger`: Isomorphic logger (a small wrapper around console.log)
- `@repo/eslint-config`: ESLint presets
- `@repo/typescript-config`: tsconfig.json's used throughout the monorepo
- `@repo/jest-presets`: Jest configurations

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Docker

This repo is configured to be built with Docker, and Docker compose. To build all apps in this repo:

```
# Install dependencies
pnpm install

# Create a network, which allows containers to communicate
# with each other, by using their container name as a hostname
docker network create app_network

# Build prod using new BuildKit engine
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose -f docker-compose.yml build

# Start prod in detached mode
docker-compose -f docker-compose.yml up -d
```

Open http://localhost:3000.

To shutdown all running containers:

```
# Stop running containers started by docker-compse
 docker-compose -f docker-compose.yml down
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

This example includes optional remote caching. In the Dockerfiles of the apps, uncomment the build arguments for `TURBO_TEAM` and `TURBO_TOKEN`. Then, pass these build arguments to your Docker build.

You can test this behavior using a command like:

`docker build -f apps/web/Dockerfile . --build-arg TURBO_TEAM=“your-team-name” --build-arg TURBO_TOKEN=“your-token“ --no-cache`

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Jest](https://jestjs.io) test runner for all things JavaScript
- [Prettier](https://prettier.io) for code formatting
