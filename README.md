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

`capacitor-assets` accepts a platform for the first argument. If specified, resources are generated only for that platform:

```bash
$ npm run capacitor-assets generate ios
```

Otherwise `capacitor-assets` will use all detected Capacitor platforms.

#### Documentation

See the help documentation on the command line with the `--help` flag.

```bash
$ npm run capacitor-assets generate --help
```
