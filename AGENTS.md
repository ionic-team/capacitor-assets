# AGENTS.md

Guidance for AI coding agents working in this repository. Humans: see README.md and CONTRIBUTING.md.

## What this is

`sssf-capacitor-assets` — a maintained fork of `@capacitor/assets` (upstream stalled). A CLI that resizes/composites source images (`assets/` or `resources/` in a Capacitor app) into icons and splash screens for iOS, Android, and PWA, and registers them (iOS `Contents.json`, Android manifest/adaptive-icon XML, web app manifest).

- Node >= 22.12, pnpm 11 (pinned via `packageManager`), TypeScript compiled by `tsc` to **CommonJS** in `dist/`
- `dist/` is **committed** — it is the install channel for `github:sssf-code/capacitor-assets#main`. After changing `src/`, run `pnpm build` and include `dist/` in the commit.
- Image processing is sharp (libvips). Native project editing is `@trapezedev/project`.

## Commands

```bash
pnpm install                 # install (frozen lockfile in CI)
pnpm build                   # tsc -> dist/
pnpm test                    # vitest run (all tests)
pnpm vitest run test/platforms/android.asset.test.ts   # one file
pnpm lint                    # oxlint + prettier --check
pnpm fmt                     # prettier --write
```

Always finish with `pnpm build && pnpm lint && pnpm test` before committing. Known quirk: `--help` on the CLI prints yargs' terse help because `loadContext` parses argv before commander does.

## Architecture

- `src/index.ts` — commander CLI definition; `bin/capacitor-assets` is the entry
- `src/ctx.ts` — context/args loading (yargs pre-parse), project paths
- `src/project.ts` — **input asset discovery**: maps files like `assets/icon-only.png`, `assets/android/notification.png`, `assets/ios/icon-dark.png` to `InputAsset`s with an `AssetKind` + `Platform`. A new input file must be wired here AND handled in each generator's `generate()` switch — an unhandled kind is silently ignored.
- `src/definitions.ts` — enums (`AssetKind`, `Platform`, densities, `IosIconAppearance`) and template interfaces
- `src/platforms/{ios,android,pwa}/assets.ts` — **output templates** (sizes, names, formats). These drive what gets generated; tests assert exact counts derived from them.
- `src/platforms/{ios,android,pwa}/index.ts` — generators: sharp pipelines + platform registration (iOS asset-catalog `Contents.json`, Android `mipmap-anydpi-v26/ic_launcher.xml` + AndroidManifest, web manifest icons)
- `src/tasks/generate.ts` — orchestration and CREATE logging

## Platform asset rules (do not regress)

- **iOS**: single 1024 icon plus iOS 18 `appearances` variants — dark (preserve alpha, never flatten) and tinted (opaque grayscale). Splash is 2732×2732 universal light/dark in `Splash.imageset`.
- **Android**: adaptive icon XML must keep a **full-bleed background** (no inset), foreground/monochrome inset 19.4% (66dp safe zone), and the `<monochrome>` layer (Android 13+ themed icons; needs compileSdk >= 33). Notification icons are 24dp-based white silhouettes (mdpi 24 → xxxhdpi 96). No ldpi.
- **PWA**: manifest icons are real PNGs (192/512/1024 `purpose: "any"` + separate padded 512 maskable — never `"any maskable"` combined), plus `apple-touch-icon.png` (180, opaque, PNG only, not in manifest). Apple splash sizes are the static `PWA_IOS_DEVICE_SIZES` list — no network fetching. Never delete files outside the tool's own `icons/` output dir.

## Testing

- Vitest; fixtures in `test/fixtures/` are **Capacitor 8 project templates** (compileSdk 36, minSdk 24) with the buildable parts stripped (no `node_modules`) — they exercise directory shape only.
- Tests assert exact generated-asset counts. Adding/removing a template in `platforms/*/assets.ts` requires updating those counts.
- Tests must not touch the network.
- Real-toolchain verification lives in `.github/workflows/e2e-build.yml`: scaffolds a fresh app from `@capacitor/app@latest`, generates via `bin/capacitor-assets`, then `gradlew assembleDebug` + AAPT2 APK checks (Android) and `xcrun actool` catalog compile (iOS). It can fail due to upstream Capacitor template changes without any change here.

## Releases & versioning

- Publishing happens **only from CI** (`.github/workflows/release.yml`) via npm Trusted Publishing (OIDC) on `v*` tags; the tag must match `package.json` version. Never run `pnpm publish` locally.
- `weekly-update.yml` bumps deps weekly, patch-bumps, tags, and dispatches the release workflow.
- **Versioning policy (maintainer's explicit choice): major versions are reserved for runtime/engine breaks (e.g. dropping a Node version). Output/behavior changes — even breaking ones — ship as minors.** Do not propose semver majors for generator output changes.
- Add a changeset (`pnpm changeset`) for user-facing changes; `pnpm changeset version` folds them into CHANGELOG.md at release time.

## Dependency constraints

- CJS dist on Node >= 22.12 means `require(esm)` works — ESM-only deps are allowed.
- `xcode` is deliberately pinned to a git SHA of `apache/cordova-node-xcode` (more maintained than the npm release); do not "fix" this to a semver range until apache publishes 4.x to npm.
- pnpm supply-chain settings live in `pnpm-workspace.yaml` (`minimumReleaseAge` 24h is on; add exceptions via `minimumReleaseAgeExclude` rather than disabling it).
- `node-html-parser` was removed on purpose (dead HIG scraping); do not reintroduce it.
