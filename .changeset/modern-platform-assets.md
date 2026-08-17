---
'sssf-capacitor-assets': minor
---

Modernize generated assets to current (2026) platform standards and fix asset wiring bugs.

**iOS**

- Generate iOS 18+ dark and tinted 1024px app icon variants alongside the light icon, registered via `appearances` in the asset catalog (Xcode 16 format). Dark preserves source transparency; tinted is derived as opaque grayscale. Explicit sources supported via `assets/ios/icon-dark.png` and `assets/ios/icon-tinted.png`.

**Android**

- Adaptive icon XML now includes a `<monochrome>` layer (required for Android 13+ themed icons; Android 16 QPR2+ force-themes icons without one) and a full-bleed background layer per spec (previously the background was incorrectly inset).
- Foreground/monochrome inset changed 16.6% → 19.4% to respect the 66dp safe zone.
- Notification icon generation is now actually wired up (`assets/android/notification.png` was previously loaded but silently ignored) and the xxxhdpi size corrected from 144px to 96px (24dp base).
- `assets/android/icon-foreground.png` / `icon-background.png` were loaded with the wrong asset kind and generated legacy icons instead of adaptive layers — fixed.
- Default dark splash was generated at 320×240 instead of 320×480 — fixed.
- Removed obsolete ldpi launcher/adaptive icons; legacy icon padding now scales with density.

**PWA**

- Icons are now genuine PNGs (previously PNG bytes were written into `.webp`-named files) in the modern size set: 192/512/1024 (`purpose: "any"`) plus a separate, safe-zone-padded 512 maskable icon (previously a single non-padded `"any maskable"` entry).
- Generates `apple-touch-icon.png` (180×180, opaque) — iOS Safari requires PNG and prefers this over manifest icons.
- Correct MIME `type` values in the manifest (the extension lookup never matched).
- iOS startup-image device list refreshed through iPhone 17 / iPhone Air / M4 iPad Pro; the broken Apple HIG scraping (which silently produced zero splashes) is removed and `--pwaNoAppleFetch` is now a no-op.
- `assets/pwa/*` platform-specific sources are now loaded (previously declared but ignored).
- Manifest cleanup no longer deletes icon files outside the tool's own `icons/` output directory — previously any user-managed icon referenced in an existing manifest (e.g. an app's own logo) could be deleted during generation.
- `--pwaTags` works again and prints correct `<link>` tags (point-based media queries, web-relative paths).
