# chth.shop

This is the monorepo for chth.shop.

## Structure
- `/backend`: Express-based server application.
- `/frontend`: Next.js frontend application.
- `/hezar`: Python utility application.

## Starting Process
1. Install dependencies at root:
   ```bash
   npm install
   ```
2. Start development servers:
   - Run backend: `npm run dev --workspace=backend`
   - Run frontend: `npm run dev --workspace=frontend`