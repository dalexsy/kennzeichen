# Firebase/Firestore remnant in kennzeichen

- **Severity:** S0
- **Check:** SEC-FIREBASE-BAN
- **Path:** kennzeichen-app/public/dryl-bug-report.js
- **Run:** audit-2026-08-09T08-57-30

## Evidence

firestore.googleapis

## Remediation

Remove Firebase SDK, config, rules, and transports. Use dryl-auth user-app-data / site APIs; edge via Cloudflare only.
