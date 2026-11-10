# Phase — Borrower Email OTP UI

Date: 2026-11-10
Issue: [#13 Borrower Email OTP and 30-day device trust](https://github.com/XUEkfk/equipment-borrow-frontend/issues/13)
Branch: `issues/13-borrower-otp-device-trust`

## Scope implemented in this phase
- Add borrower Email OTP controls to the public application form.
- Call the existing `email.requestCode` and `email.verifyCode` backend actions.
- Add input validation, request/verify status, 60-second resend cooldown, timeout handling, and reset verification when the Email changes.
- Keep the borrow submit button disabled. No `borrow.create` call is added.

## Security boundary
- OTP verification state is memory-only and scoped to the current page.
- No Email, OTP, trust marker, or bearer credential is persisted by this frontend change.
- 30-day browser/device trust is NOT implemented yet. Backend must issue and validate an opaque, revocable device-trust credential and enforce expiry server-side before this behavior can be enabled.
- This frontend does not treat localStorage, Email, or a client-side boolean as authorization.

## Dependencies / open work
- Backend device-trust API and storage/expiry/revocation design.
- Confirm OTP marker is bound to the borrower verification flow and cannot be reused across administrator authentication.
- Backend #27 abuse protection and public API review.
- Real Apps Script / browser integration tests for OTP send, verify, rate limits, expiry, device binding, and 30-day renewal.

## Verification
- Static safety review: no `borrow.create` action introduced; submit remains disabled; only existing OTP actions are called.
- Runtime/browser tests: not yet run.
- Real Email delivery: not tested in this phase.
- GAS deployment: unchanged.

## Next steps
1. Finish backend device-trust API contract and implementation.
2. Integrate the opaque trust credential without exposing it in URL or logs.
3. Complete browser/GAS integration tests before enabling borrow submission.
