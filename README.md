# sssf-capacitor-assets

> **NOTE**
>
> This is a maintained fork of [`@capacitor/assets`](https://github.com/ionic-team/capacitor-assets) (upstream is stalled), renamed to `sssf-capacitor-assets` as of 4.0.0. It requires Node >= 22.12.

This tool will crop and resize JPEG and PNG source images to generate icons and splash screens for iOS, Android, and Progressive Web Apps using [Capacitor](https://capacitorjs.com/).

Note: previous versions of this tool supported Cordova but Cordova support has been removed as of `1.x`. We strongly recommend teams [migrate to Capacitor](https://capacitorjs.com/docs/cordova/migrating-from-cordova-to-capacitor).

## Install

From npm (published releases, with provenance):

```shell
pnpm add -D sssf-capacitor-assets
# or: npm install --save-dev sssf-capacitor-assets
```

Or track the main branch directly:

```shell
pnpm add -D github:sssf-code/capacitor-assets#main
# or: npm install --save-dev github:sssf-code/capacitor-assets#main
```

## Usage

The tool expects a `assets` or `resources` folder to exist in the root of the project.

There are two modes this tool can be used in: Easy Mode, and Full Control mode.

### Usage - Easy Mode (recommended)

With Easy Mode, the tool supports generating all the icon and splash assets you need for iOS, Android, and PWA from a single logo file along with an optional dark mode logo, and background colors. This is the easiest way to generate all your assets, but it trades customizability for convenience.

To use this mode, create a single `logo.png` or `icon.png` with an optional `logo-dark.png` in `assets/` (the tool also supports using SVG files as source images, substitue `.svg` as needed):

```
assets/
├── logo.png
└── logo-dark.png
```

Then, generate the assets and provide the background colors that will be used to generate background layers for icons:

```shell
npx capacitor-assets generate --iconBackgroundColor '#eeeeee' --iconBackgroundColorDark '#222222' --splashBackgroundColor '#eeeeee' --splashBackgroundColorDark '#111111'
```

Where the provided flags are:

- `--iosProject` - the path to the iOS project (default `ios/App`)
- `--androidProject` - the path to the Android project (default `android`)
- `--assetPath <path>` - Path to the assets directory for your project. By default will check `"assets"` and `"resources"` directories, in that order.
- `--iconBackgroundColor` - the background color (hex value) used when generating icon layers for light mode (default `#ffffff`)
- `--iconBackgroundColorDark` - the background color (hex value) used when generating icon layers for dark mode (where supported) (default `#111111`)
- `--splashBackgroundColor` - the background color (hex value) used when generating splash screens (default `#ffffff`)
- `--splashBackgroundColorDark` - the background color (hex value) used when generating splash screens for dark mode (where supported) (default `#111111`)
- `--logoSplashTargetWidth` - A specific width to set the logo to when generating splash screens from a single logo file (not used by default, logo is scaled as percentage of splash instead, see `--logoSplashScale`)
- `--logoSplashScale` - the scale multiplier to apply to the logo when generating splash screens from a single logo file (default: `0.2`)
- `--androidFlavor <name>` - the Android product flavor where generated assets will be created (default `main`)
- `--pwaTags` - log the `index.html` tags needed to use the generated PWA icons and iOS splash screens
- `--ios` - explicitly run iOS asset generation. Using a platform flag makes the platform list exclusive.
- `--android` - explicitly run Android asset generation. Using a platform flag makes the platform list exclusive.
- `--pwa` - explicitly run PWA asset generation. Using a platform flag makes the platform list exclusive.

### Usage - Custom Mode

This mode provides full control over the assets used to generate icons and splash screens, but requires more source files. To use this mode, provide custom icons and splash screen source images as shown below:

```
assets/
├── icon-only.png
├── icon-foreground.png
├── icon-background.png
├── splash.png
└── splash-dark.png
```

- `assets/icon-only.(png|jpg)` must be at least 1024×1024px
- `assets/icon-(foreground|background).(png|jpg)` must be at least 1024×1024px
- `assets/splash[-dark].(png|jpg)` must be at least 2732×2732px

Additional platform-specific source images may be provided in `assets/ios/`, `assets/android/`, and `assets/pwa/` subdirectories to override a source for a single platform:

```
assets/
├── ios/
│   ├── icon.png          # iOS app icon (light appearance)
│   ├── icon-dark.png     # optional iOS 18+ dark appearance icon (transparent background recommended)
│   ├── icon-tinted.png   # optional iOS 18+ tinted appearance icon (opaque grayscale)
│   ├── splash.png
│   └── splash-dark.png
├── android/
│   ├── icon.png
│   ├── icon-foreground.png
│   ├── icon-background.png
│   ├── notification.png  # status bar notification icon — must be a white silhouette on transparency
│   ├── splash.png
│   └── splash-dark.png
└── pwa/
    ├── icon.png
    ├── splash.png
    └── splash-dark.png
```

### What is generated

**iOS**

- A single 1024×1024 `AppIcon` (the Xcode 14+ single-size format), plus iOS 18+ **dark** and **tinted** appearance variants registered in the asset catalog. When not provided explicitly, the dark variant preserves the source's transparency and the tinted variant is derived as grayscale.
- 2732×2732 universal light and dark launch images in `Splash.imageset` (used by Capacitor's `LaunchScreen.storyboard`).

**Android**

- Adaptive icons (`mipmap-*/ic_launcher_foreground.png` / `ic_launcher_background.png`) with an `ic_launcher.xml` that includes a full-bleed background and a **`<monochrome>` layer** for Android 13+ themed icons.
- Legacy and round launcher icons for API < 26.
- Status bar notification icons (`drawable-*/ic_stat_notification.png`, 24dp base size) when `assets/android/notification.png` is provided. Android renders these as pure silhouettes — the source must be white-on-transparent or it will appear as a solid block.
- Splash screens per density, light and dark.

**PWA**

- `icon-192.png`, `icon-512.png`, `icon-1024.png` (manifest `purpose: "any"`) and `icon-512-maskable.png` (separate `purpose: "maskable"` entry, composited onto `--iconBackgroundColor` with the logo confined to the safe zone).
- `apple-touch-icon.png` (180×180, opaque) for iOS Add to Home Screen — link it from your `index.html`.
- `apple-splash-*` startup images for current iPhone/iPad screen sizes, light and dark. Run with `--pwaTags` to print the `<link>` tags to add to your `index.html`.

To generate resources with all the default options, just run:

```shell
npx capacitor-assets generate
```

`sssf-capacitor-assets` accepts a platform for the first argument (`ios`, `android`, or `pwa` currently). If specified, resources are generated only for that platform:

```shell
npx capacitor-assets generate --ios
```

Otherwise `sssf-capacitor-assets` will use all detected Capacitor platforms.

## PWA Notes

### Manifest

This tool will create and/or update the web app manifest used in your project, and supports both the older `manifest.json` file and the newer `manifest.webmanifest` files, preferring `manifest.webmanifest` when no existing manifest is found.

By default, the tool will look for the manifest file in `public`, `src`, and `www` in that order. Use the flag `--pwaManifestPath` to specify the exact path to your web app manifest.

### Help

See the help instructions on the command line with the `--help` flag.

```shell
npx capacitor-assets generate --help
```
