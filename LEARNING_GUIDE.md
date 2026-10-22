# Semester Manager: reading the code

Start with one request rather than reading every file.

1. `frontend/src/pages/subjects/SubjectsList.tsx` submits a subject.
2. `frontend/src/utils/api.ts` adds the login token.
3. `backend/src/server.js` mounts the subjects router.
4. `backend/src/middleware/auth.js` verifies identity and related-record ownership.
5. `backend/src/routes/subjectRoutes.js` selects the controller. Nested record routes also use `ownsRecord`.
6. `backend/src/controllers/subjectController.js` performs the operation.
7. `backend/src/models/Subject.js` defines database validation.

## Why these choices

- React state handles local UI; Context is limited to identity and theme.
- Lazy page imports reduce startup downloads without changing how pages work.
- Express routes describe URLs; controllers handle operations; Mongoose models validate stored data.
- Authentication answers who the caller is. Authorization checks whether that caller owns the subject.
- Backups allocate new IDs and remap references inside a transaction. MongoDB must support transactions (replica set or Atlas).
- CSS variables give the same components light and dark appearances.
- One toast library avoids duplicate renderers and inconsistent notifications.

## Interview exercises

Trace an attendance update. Explain why the backend must validate ownership even when the UI only shows your subjects. Explain why a successful JavaScript build does not prove database behavior. Compare loading all pages at startup with lazy imports. Explain partial failure during deletion and how a transaction/outbox could improve it.

## Verification and remaining work

Run `npm run build`, `npm run lint --workspace frontend`, and `node --test backend/test/*.test.js`.
The existing lint backlog still needs cleanup. Live storage, database restore, deletion, and multi-user flows require a separate development environment. The current UI refresh is an initial implementation of the approved light/dark direction, not yet a visually verified final redesign.
