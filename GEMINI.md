# Bare Minimum Coding Standards

## General & TypeScript

- **Strict Typing:** Avoid `any`. Use `interface` or `type` for all variables, props, and payloads. Use `unknown` if necessary.
- **Naming:** `camelCase` for variables/functions; `PascalCase` for components/types; `UPPER_SNAKE_CASE` for global constants.
- **Formatting:** Follow Prettier/ESLint. Document any linting bypasses with `// eslint-disable-next-line`.
- **Documentation:** Avoid over-commenting. Use self-descriptive function names for complex logic instead of one-line comments. However multi-line documentation comments are good.
- **Pragmatism:** Prioritize practical, efficient solutions.
- **Confidence & Accuracy:** Ensure 95% certainty before committing code; when in doubt, ask for clarification to maintain high output quality.

## Frontend

- **Components:** Functional components only. One component per file.
- **State:** Keep state local; only use global context (e.g., `useAuth`) when essential.
- **Styling:** Use Tailwind CSS. Avoid custom `.css` files unless strictly necessary.

## Backend

- **Async/Await:** Use `async/await` over `.then()` for readability.
- **Error Handling:** Use `try/catch` in controllers and pass errors to middleware via `next(error)`.
- **Security:** Never hardcode secrets. Always use `process.env`.
