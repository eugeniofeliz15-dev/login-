# Delinut

Frontend SPA for the Solandre food-ordering API, built with React, TypeScript, Vite, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Create a `.env.local` file to override the API URL if needed:

```text
VITE_API_URL=https://backend-solandre.onrender.com
```

The app uses the Solandre API by default. Sign in with an existing account or register a customer account. The interface adapts to the authenticated role:

- **Customers** can browse today's and weekly menus, filter by date, inspect ingredients, customize exclusions, place and track orders, cancel eligible orders, review their order history, and update their profile.
- **Kitchen staff** can process the active queue, review historical orders and preparation statistics, and receive kitchen notifications.
- **Delivery staff** can take assigned orders, open delivery directions, notify customers of arrival, confirm delivery and cash payment, and receive assignment notifications.
- **Administrators** can filter and manage orders, menus, dishes, ingredients, employees, customers, and delivery zones; review client histories and daily KPIs; and inspect service health and roles.

The app shell and role navigation live in `src/App.tsx`. Authentication, customer, kitchen, delivery, and administration screens are separated in `src/pages/`; shared UI is in `src/components/`, API calls in `src/services/`, domain models in `src/types/`, and formatting helpers in `src/utils/`.

## Production build

```bash
npm run build
npm run preview
```
