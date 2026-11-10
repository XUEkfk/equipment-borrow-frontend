# Borrower OTP Security Hardening — Initial Review

Status: In progress  
Base: `issues/13-borrower-otp-device-trust`  
Working branch: `issues/13-otp-security-hardening`

## Scope

- Preserve the tested Email OTP and 30-day single-browser trust flow.
- Review browser credential storage, DOM rendering, request lifecycle, and failure handling.
- Keep production frontend behavior unchanged until changes are reviewed and tested.

## Initial findings

1. The current OTP implementation stores the opaque 30-day device credential in `localStorage`. This was approved for isolated functional testing only; any same-origin script execution, including XSS, can read it.
2. OTP state is associated with the normalized Email and reset when the Email changes. Device trust is confirmed by the backend rather than trusting local storage alone.
3. Reviewed dynamic equipment rendering uses `createElement`, `textContent`, and `replaceChildren`; no direct `innerHTML` use was found in the reviewed `app.js` path. This is not a complete XSS audit.
4. The OTP request cooldown is client-side for user experience only; backend enforcement remains authoritative.

## Verification

- Read-only source review covered `app.js`, `admin.js`, `index.html`, `admin.html`, `config.js`, and `styles.css`.
- No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, or `new Function` sinks were found in the reviewed frontend files.
- Dynamic equipment and admin-request content is rendered through DOM node creation and `textContent` in the reviewed paths.
- `config.js` contains the public GAS Web App endpoint only; it does not contain an admin password or private credential. A public endpoint is not an authentication secret.
- No frontend code behavior changed in this review.
- Production frontend was not deployed or modified.
- This is a targeted static review, not a complete security certification or runtime XSS test.

## Remaining work

- Review all pages/scripts and configuration loading for DOM injection and unsafe URL handling.
- Assess storage options that are compatible with the GitHub Pages + GAS Web App architecture; do not assume HttpOnly cookies are available through GAS.
- Preserve single-active-browser semantics and test refresh, replacement, revocation, and ambiguous activation outcomes.
