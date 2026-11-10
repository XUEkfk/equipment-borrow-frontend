# Borrower OTP Security Hardening — Assessment Complete

Status: Assessment complete; implementation decision pending  
Base: `issues/13-borrower-otp-device-trust`  
Working branch: `issues/13-otp-security-hardening`  
Related assessment: backend Issue #40

## Scope

- Preserve the tested Email OTP and 30-day single-browser trust flow.
- Review browser credential storage, DOM rendering, request lifecycle, and failure handling.
- Keep production frontend behavior unchanged until changes are reviewed and tested.

## Findings

1. The current OTP implementation stores the opaque 30-day device credential in `localStorage`. This was approved for isolated functional testing only; any same-origin script execution, including XSS, can read it.
2. OTP state is associated with the normalized Email and reset when the Email changes. Device trust is confirmed by the backend rather than trusting local storage alone.
3. Reviewed dynamic equipment and admin-request rendering uses `createElement`, `textContent`, and `replaceChildren`. No direct `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, or `new Function` sink was found in the reviewed frontend files.
4. The OTP request cooldown is client-side for user experience only; backend enforcement remains authoritative.
5. The credential is sent to the GAS API in a POST JSON body. The reviewed code does not put it in a URL or intentionally log it.
6. The frontend displays API messages using `textContent`; the reviewed UI path does not interpret backend error messages as HTML.
7. `config.js` contains the public GAS Web App endpoint only; it does not contain an admin password or private credential. A public endpoint is not an authentication secret.
8. The static HTML currently has no Content Security Policy declaration. A meta CSP could provide defense in depth, but its directives and GAS fetch compatibility require testing. It cannot replace safe DOM handling or eliminate XSS.

## Storage option assessment

- `localStorage`: lowest implementation cost and compatible with the current architecture; readable by same-origin JavaScript, so bearer credential theft remains possible under XSS.
- `sessionStorage` / IndexedDB: still JavaScript-readable; no material protection against a same-origin XSS attacker.
- Web Crypto non-extractable key: may reduce direct private-key export, but same-origin XSS may still invoke the key. Requires challenge/signature APIs, replay defense, and lifecycle handling; not a drop-in replacement.
- HttpOnly Cookie: not a direct fit for GitHub Pages frontend plus cross-origin GAS Web App. A same-origin BFF/proxy or hosting architecture change would likely be required.
- WebAuthn: stronger origin-bound public-key authentication, but needs RP ID/domain decisions, challenge verification, recovery, and GAS integration; out of scope for a low-cost patch.

## Verification

- Read-only source review covered `app.js`, `admin.js`, `index.html`, `admin.html`, `config.js`, and `styles.css`.
- Static review only; no browser runtime XSS/penetration testing was performed.
- No frontend code behavior changed in this assessment.
- Production frontend was not deployed or modified.
- The current production URL is live, but this branch is not the live version. Most checks remain branch/local verification.

## Recommendation

Do not migrate to IndexedDB/sessionStorage and do not implement Web Crypto, WebAuthn, or a BFF in this phase. Preserve the existing 30-day single-browser trust behavior.

A small CSP-only hardening task is the only plausible low-cost follow-up, but it must be tested for compatibility with the GAS API fetch and the deployed hosting configuration before release. Because no direct HTML injection sink was found in the targeted review, it is reasonable to defer CSP implementation if it delays core borrow/review/return functionality.

The current localStorage bearer credential remains a known production risk and should not be described as XSS-safe. Before enabling borrow submission, complete a broader runtime security review and explicitly approve the credential strategy.

## Follow-up

- [ ] Decide whether to implement a tested CSP meta policy as a small isolated change.
- [ ] Keep the localStorage credential strategy marked as isolated-test-only until explicitly approved for production.
- [ ] Preserve the 30-day expiry and single-active-browser behavior.
- [ ] Prioritize core borrowing, approval, and return features if security work exceeds the agreed time budget.
