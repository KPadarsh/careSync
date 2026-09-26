# Portal Commit and Push Workflow Rule

## Workflow Requirement
Whenever a new portal (e.g. Pharmacy, Lab Technician, Billing/Admin, etc.) or major module is implemented:
1. Complete all routes, UI views, backend endpoints, and Mongoose integration.
2. Verify TypeScript compilation (`npx tsc --noEmit`) and runtime status (200 OK).
3. Stage, commit with a descriptive message, and **push to GitHub immediately (one by one)** before moving on to the next portal.
4. Ensure each portal is committed and pushed individually so that repository history remains modular and clean.
