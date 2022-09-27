# Capacitor Assets

This tool will crop and resize JPEG and PNG source images to generate icons and splash screens for iOS, Android, and Progressive Web Apps using [Capacitor](https://capacitorjs.com/).

Note: previous versions of this tool supported Cordova but Cordova support has been removed as of `1.x`. We strongly recommend teams [migrate to Capacitor](https://capacitorjs.com/docs/cordova/migrating-from-cordova-to-capacitor).

## Install

```bash
$ npm install @capacitor/assets@next
```

Then add this script to your `package.json`:

```
{
  "scripts": {
    "capacitor-assets": "capacitor-assets"
  }
}
```

## Usage

The tool expects a `assets` folder to exist in the root of the project with the following structure:

There are two modes this tool can be used in: Easy Mode, and Full Control mode.

### Usage - Easy Mode

With Easy Mode, the tool supports generating all the icon and splash assets you need for iOS, Android, and PWA from a single logo file along with an optional dark mode logo, and background colors. This is the easiest way to generate all your assets, but it trades customizability for convenience.

To use this mode, create a single `logo.png` with an optional `logo-dark.png` in `assets/`:

```
assets/
├── logo.png
└── logo-dark.png
```

Then, generate the assets and provide the background colors that will be used to generate background layers for icons:

```bash
$ npm run capacitor-assets generate -- --iconBackgroundColor '#eeeeee' --iconBackgroundColorDark '#222222' --splashBackgroundColor '#eeeeee' --splashBackgroundColorDark '#111111'
```

Where the provided flags are:

- `--iconBackgroundColor` - the background color (hex value) used when generating icon layers for light mode (default `#ffffff`)
- `--iconBackgroundColorDark` - the background color (hex value) used when generating icon layers for dark mode (where supported) (default `#111111`)
- `--splashBackgroundColor` - the background color (hex value) used when generating splash screens (default `#ffffff`)
- `--splashBackgroundColorDark` - the background color (hex value) used when generating splash screens for dark mode (where supported) (default `#111111`)

### Usage - Custom Mode

This mode provides full control over the assets used to generate icons and splash screens, but requires more source files. To use this mode, provide custom icons and splash screen source images as shown below:

```
assets/
├── icon.png
├── icon-foreground.png
├── icon-background.png
├── splash.png
└── splash-dark.png
```

- `assets/icon.(png|jpg)` must be at least 1024×1024px
- `assets/icon-(foreground|background).(png|jpg)` must be at least 1024×1024px
- `assets/splash[-dark].(png|jpg)` must be at least 2732×2732px

To generate resources with all the default options, just run:

```bash
$ npm run capacitor-assets generate
```

`capacitor-assets` accepts a platform for the first argument (`ios`, `android`, or `pwa` currently). If specified, resources are generated only for that platform:

```bash
$ npm run capacitor-assets generate -- --ios
```

Otherwise `capacitor-assets` will use all detected Capacitor platforms.

## PWA Notes

### Manifest

This tool will create and/or update the web app manifest used in your project, and supports both the older `manifest.json` file and the newer `manifest.webmanifest` files, preferring `manifest.webmanifest` when no existing manifest is found.

By default, the tool will look for the manifest file in `public`, `src`, and `www` in that order. Use the flag `--pwaManifestPath` to specify the exact path to your web app manifest.

### Help

See the help instructions on the command line with the `--help` flag.

```bash
$ npm run capacitor-assets generate --help
```
