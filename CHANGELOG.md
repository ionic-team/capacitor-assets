# sssf-capacitor-assets

> Renamed from `@capacitor/assets` in 4.0.0 (fork of ionic-team/capacitor-assets).

## 4.1.0

### Minor Changes

- Modernize generated assets to current (2026) platform standards. See `.changeset/modern-platform-assets.md` for the full list. Highlights:
  - **iOS**: iOS 18+ dark and tinted 1024px icon variants (Xcode 16 `appearances` format), with optional `ios/icon-dark.png` / `ios/icon-tinted.png` sources. Verified with Xcode 26 actool.
  - **Android**: `<monochrome>` layer for Android 13+ themed icons (needs compileSdk >= 33), spec-compliant full-bleed background, 19.4% safe-zone foreground inset; notification icon generation wired up (xxxhdpi 144→96px); fixed `android/icon-foreground`/`icon-background` asset kinds and dark default splash dimensions; ldpi icons dropped. Verified with a real Capacitor 8 Gradle build.
  - **PWA**: genuine PNG icons at 192/512/1024 plus separate safe-zone maskable icon and `apple-touch-icon.png`; correct manifest MIME types; manifest cleanup no longer deletes user-managed files; Apple splash device list refreshed through iPhone 17 / M4 iPad Pro; broken HIG scraping removed (`--pwaNoAppleFetch` is a no-op, `node-html-parser` dropped); `--pwaTags` works again.

## 3.0.4

### Patch Changes

- 5f42c57: fix sharp vulnerability by bumping patch version

## 3.0.3

### Patch Changes

- 3c5ecbe: Fix the path discovered for Angular and Vue project when --pwa option used

## 3.0.1

### Patch Changes

- 2c19107: fix: properly configure the single 1024x1024 iOS icon

## 3.0.0

### Major Changes

- 99a87f4: Only generate 1024x1024 for iOS icons for xcode 14 compatibility

### Patch Changes

- c5138af: Fix critical dependency issues and update Cap Cli dependency

## 2.0.4

### Patch Changes

- Fix Android drawable issue

## 2.0.3

### Patch Changes

- General all iOS sub-icons from main icon

## 2.0.2

### Patch Changes

- Android non-density asset generation

## 2.0.1

### Patch Changes

- Android launcher padding #424

## 2.0.0

### Major Changes

- Fixed icon generation issue on iOS and normalized argument format"

## 1.0.14

### Patch Changes

- Fixed android legacy icon sizes

## 1.0.13

### Patch Changes

- Added logoSplashScale and logoTargetWidth to Android

## 1.0.12

### Patch Changes

- Fixed PWA icon source path

## 1.0.11

### Patch Changes

- Added flags to support custom iOS and Android folders

## 1.0.10

### Patch Changes

- Support loading icon.png for easy mode

## 1.0.9

### Patch Changes

- Fixed iOS and Android logo generation

## 1.0.8

### Patch Changes

- Add --logoSplashTargetWidth and --logoSplashScale

## 1.0.7

### Patch Changes

- Fixed icon backgrounds for iOS

## 1.0.6

### Patch Changes

- Fixed Contents.json for iOS icons

## 1.0.5

### Patch Changes

- Fixed iOS Assets

## 1.0.4

### Patch Changes

- Fixed iOS asset generation #325

## 1.0.3

### Patch Changes

- Fixed iOS image sizes

## 1.0.2

### Patch Changes

- Updated Trapeze library and better project root handling

## 1.0.1

### Patch Changes

- Moved to Trapeze
