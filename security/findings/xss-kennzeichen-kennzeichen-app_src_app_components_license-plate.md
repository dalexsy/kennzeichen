# Potential XSS sink in kennzeichen

- **Severity:** S1
- **Check:** SEC-XSS-INNERHTML
- **Path:** kennzeichen-app/src/app/components/license-plate-item/license-plate-item.html
- **Run:** audit-2026-08-09T08-57-30

## Evidence

lines 25, 30

## Remediation

Sanitize or use textContent / Angular bindings; never trust user HTML.
