# Gemini Workspace Context: PSITS Web Platform

This document provides context for the PSITS Web Platform, a monorepo containing the frontend and backend for the organization's web application.

## Project Overview

- **Purpose**: A comprehensive web platform for the Philippine Society of Information Technology Students (PSITS) at the University of Cebu - Main Campus.
- **Architecture**: Monorepo containing three main projects:
  1.  `client-side`: Legacy frontend (React, JavaScript).
  2.  `client-side-ts`: **Current frontend** (React, TypeScript, Vite, Tailwind CSS).
  3.  `server-side`: Backend API (Node.js, Express, TypeScript, MongoDB).
- **Authentication**: The project uses a robust v2 authentication system with JWT access and refresh tokens. See `docs/AUTH_V2_FLOW.md` for a detailed explanation.

---

## 1. Frontend (`client-side-ts`)

This is the primary, modern frontend. Development should be focused here.

- **Tech Stack**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Key Directories**:
  - `src/features`: Contains domain-specific logic (e.g., `auth`, `events`).
  - `src/components`: Shared UI components.
  - `src/router.ts`: Defines all application routes and their protection guards.
  - `src/api/axios.ts`: The configured Axios instance that handles automatic token refreshing.
- **Entrypoint**: `src/main.tsx`

### Development Commands

- **Install Dependencies**:
  ```bash
  cd client-side-ts
  npm install
  ```
- **Run Development Server**:
  ```bash
  npm run dev
  ```
- **Build for Production**:
  ```bash
  npm run build
  ```
- **Lint & Format**:
  ```bash
  npm run lint
  npm run format
  ```

### Frontend Conventions

- **State Management**: Use the `useAuth` hook from `@/features/auth` for user authentication state.
- **API Calls**: Always use the shared Axios instance from `@/api/axios` for API requests to ensure authentication headers and refresh logic are applied.
- **Routing**: Protect routes using the guards from `@/components/common/RouteGuards.tsx`. See `client-side-ts/docs/AUTH_V2_FRONTEND.md`.

---

## 2. Backend (`server-side`)

This is the backend API that serves the frontend applications.

- **Tech Stack**: Node.js, Express, TypeScript, Mongoose (MongoDB).
- **Key Directories**:
  - `src/routes`: Defines API endpoints.
  - `src/controllers`: Contains the business logic for each route.
  - `src/middlewares`: Holds authentication and authorization middleware.
  - `src/models`: Mongoose schemas for the database.
- **Entrypoint**: `src/index.ts`

### Development Commands

- **Install Dependencies**:
  ```bash
  cd server-side
  npm install
  ```
- **Run Development Server (with hot-reload)**:
  ```bash
  npm run dev
  ```
- **Build for Production**:
  ```bash
  npm run build
  ```
- **Start in Production**:
  ```bash
  npm run start
  ```

### Backend Conventions

- **Route Protection**: Use the V2 middleware from `src/middlewares/authV2.middleware.ts`.
- **Middleware Order**: Follow the documented layering: `Token Check -> Role Check -> Access Level Check`.
- **User Data**: Access authenticated user data via the `req.userV2` object in controllers.
- **Documentation**: Refer to `server-side/docs/AUTH_V2_BACKEND.md` for detailed instructions on protecting routes.

---

## 3. Legacy Frontend (`client-side`)

This is the original JavaScript-based React frontend. It is considered legacy and new development should be avoided.

### Development Commands

- **Install Dependencies**:
  ```bash
  cd client-side
  npm install
  ```
- **Run Development Server**:
  ```bash
  npm run dev
  ```

## 4. Bare Minimum Coding Standards

To keep the codebase maintainable, prevent technical debt, and ensure smooth collaboration across the student development team, please adhere to these baseline standards:

### General & TypeScript

- **Strict Typing:** Avoid `any`. Explicitly define an `interface` or `type` for all variables, component props, and API request/response payloads. If a type is truly unknown, use `unknown`.
- **Naming Conventions:**
  - Variables and Functions: `camelCase` (e.g., `fetchEventDetails`).
  - Components, Interfaces, and Types: `PascalCase` (e.g., `EventCard`, `UserPayload`).
  - Global Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_UPLOAD_SIZE`).
- **Formatting:** Rely on Prettier and ESLint. Do not bypass linting warnings without a documented `// eslint-disable-next-line` comment explaining why.
- **In-line documentations:** As much as possible prevent over-commenting. Multi-line comments on top of controllers or routes are good but if we have complex logic, instead of putting one-line comments, try to make it readable by creating a separate function with a self-descriptive name.
- **Pragmatism:** As much as possible, always be pragmatic in your choices. Choose the practical choices.

### Frontend (`client-side-ts`)

- **Components:** Use functional components with Hooks. Keep files to one component per file unless it's a very small, tightly coupled sub-component.
- **State:** Keep state local whenever possible. Only lift state to global contexts (like `useAuth`) when multiple disparate components need access to it.
- **Styling:** Utilize Tailwind CSS utility classes. Avoid creating custom `.css` files unless strictly required for complex animations or unavoidable third-party overrides.

### Backend (`server-side`)

- **Async/Await:** Use `async/await` instead of raw `.then()` chaining to ensure readable, top-down logic.
- **Error Handling:** Never swallow errors silently. Wrap controller logic in `try/catch` blocks and pass errors down to the centralized error-handling middleware using `next(error)`.
- **Security:** Never hardcode secrets, database URIs, or JWT keys. Always use `process.env` variables.
