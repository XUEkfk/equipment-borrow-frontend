# Phase — Borrower Email OTP UI

Date: 2026-11-10
Issue: [#13 Borrower Email OTP and 30-day device trust](https://github.com/XUEkfk/equipment-borrow-frontend/issues/13)
Branch: `issues/13-borrower-otp-device-trust`

## Scope implemented in this phase
- Add borrower Email OTP controls to the public application form.
- Call the borrower-isolated `borrower.email.requestCode` and `borrower.email.verifyCode` backend actions.
- Add input validation, request/verify status, 60-second resend cooldown, timeout handling, and reset verification when the Email changes.
- Keep the borrow submit button disabled. No `borrow.create` call is added.

## Security boundary
- OTP verification state is memory-only and scoped to the current page.
- No Email, OTP, trust marker, or bearer credential is persisted by this frontend change. The UI calls borrower-specific OTP actions only.
- 30-day browser/device trust is NOT implemented yet. Backend must issue and validate an opaque, revocable device-trust credential and enforce expiry server-side before this behavior can be enabled.
- This frontend does not treat localStorage, Email, or a client-side boolean as authorization.

## Dependencies / open work
- Backend device-trust API and storage/expiry/revocation design.
- Backend #27 abuse protection and public API review.
- Real Apps Script / browser integration tests for OTP send, verify, rate limits, expiry, device binding, and 30-day renewal.

## Verification
- Static safety review: no `borrow.create` action introduced; submit remains disabled; only borrower-specific OTP actions are called.
- Runtime/browser tests: not yet run.
- Real Email delivery: not tested in this phase.
- GAS deployment: unchanged.

## Next steps
1. Finish backend device-trust API contract and implementation.
2. Integrate the opaque trust credential without exposing it in URL or logs.
3. Complete browser/GAS integration tests before enabling borrow submission.

## Phase 2 — 30-day single-browser trust integration (2026-11-10)
- Integrated backend actions `borrower.device.check`, `borrower.device.trust`, and `borrower.device.revoke`.
- Uses `localStorage` only because the user explicitly approved it for an isolated functional-test phase. Credential is stored per normalized Email and checked with the backend before OTP is skipped.
- After OTP succeeds, the frontend requests a single-device trust credential. If browser storage fails after issuance, it attempts to revoke the newly issued credential so the previous trusted browser is not displaced without a saved replacement.
- If another browser completes OTP and receives a credential, the prior browser's credential fails its next server check.
- Borrow submission remains disabled; no `borrow.create` action is called.
- This implementation is **not production-safe**: JavaScript/XSS can read localStorage credentials. A later security phase must replace or redesign this storage before production rollout.
- Browser/GAS runtime tests have not yet been run. Static review only; user must run local tests and perform isolated browser tests.


## Phase 2 — staged 30-day device trust activation (2026-11-10)
- Uses the approved isolated-test-only localStorage credential storage.
- After OTP, frontend calls `borrower.device.prepare`, persists the pending credential, then calls `borrower.device.activate`.
- A failed localStorage write cancels the pending credential; the previously active browser remains trusted.
- If activation request outcome is ambiguous, frontend checks the persisted credential with `borrower.device.check` before removing it.
- Email field change triggers a server-side device trust check; valid trust can be recognized without requesting another OTP.
- Backend contract actions are now `prepare`, `activate`, `cancel`, `check`, and `revoke`; no immediate-replacement `borrower.device.trust` action remains.
- Borrow submission remains disabled and no `borrow.create` request is sent.
- Static syntax checks were previously clean before this update; re-run `node --check app.js` and `node --check admin.js` after pulling the latest branch.
- No deployment, PR, merge, or main-branch changes. localStorage remains temporary and not production-safe against XSS.
