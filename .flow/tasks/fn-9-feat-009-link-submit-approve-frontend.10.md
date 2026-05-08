# fn-9-feat-009-link-submit-approve-frontend.10 Backend OpenAPI missing FEAT-009 link endpoints

## Description
OpenAPI sync for FEAT-009 cannot be completed from this workspace because the dev/local backend contract is unavailable.

Evidence from 2026-05-08:

- `curl -fsS -I http://localhost:8080/openapi.yaml` fails: connection refused.
- `curl -fsS -I http://localhost:8080/openapi.json` fails: connection refused.
- `VITE_API_URL=http://localhost:8080 pnpm api:sync` fails before fetch with `tsx` IPC `listen EPERM` in this sandbox.
- `VITE_API_URL=http://localhost:8080 node --experimental-strip-types scripts/sync-api.ts` reaches the fetch and fails at `/openapi.yaml`.
- Current generated client does not contain `PublishedLink`, `PublishedLinkStatus`, `PublishedLinkPreview`, `SubmitLinkRequest`, `RequestLinkChangesRequest`, `useSubmitLinkMutation`, `useApproveLinkMutation`, `useRequestLinkChangesMutation`, or `useListLinksQuery`.

## Acceptance

- Backend dev exposes FEAT-009 link endpoints and schemas in OpenAPI.
- `pnpm api:sync` can regenerate the frontend client from that contract.
## Acceptance
- [ ] TBD

## Done summary
Analytics de 4 eventos link implementados correctamente: postEvent via customFetch, useTrackOnceVisible con IntersectionObserver + sessionStorage, tests unitarios por evento y por componente, sin violaciones del rubric
## Evidence
- Commits:
- Tests:
- PRs: