# Capacitor Assets

This tool will crop and resize JPEG and PNG source images to generate icons and splash screens for iOS, Android, and Progressive Web Apps using [Capacitor](https://capacitorjs.com/).

Note: previous versions of this tool supported Cordova but Cordova support has been removed as of `1.x`. We strongly recommend teams [migrate to Capacitor](https://capacitorjs.com/docs/cordova/migrating-from-cordova-to-capacitor).

## Install

```shell
npm install --save-dev @capacitor/assets
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
npx @capacitor/assets generate --iconBackgroundColor '#eeeeee' --iconBackgroundColorDark '#222222' --splashBackgroundColor '#eeeeee' --splashBackgroundColorDark '#111111'
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

To generate resources with all the default options, just run:

```shell
npx @capacitor/assets generate
```

`@capacitor/assets` accepts a platform for the first argument (`ios`, `android`, or `pwa` currently). If specified, resources are generated only for that platform:

```shell
npx @capacitor/assets generate --ios
```

Otherwise `@capacitor/assets` will use all detected Capacitor platforms.

## PWA Notes

### Manifest

This tool will create and/or update the web app manifest used in your project, and supports both the older `manifest.json` file and the newer `manifest.webmanifest` files, preferring `manifest.webmanifest` when no existing manifest is found.

By default, the tool will look for the manifest file in `public`, `src`, and `www` in that order. Use the flag `--pwaManifestPath` to specify the exact path to your web app manifest.

### Help

See the help instructions on the command line with the `--help` flag.

```shell
npx @capacitor/assets generate --help
```
