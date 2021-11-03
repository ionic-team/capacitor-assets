# Capacitor Assets

This tool will crop and resize JPEG and PNG source images to generate icons and splash screens for iOS, Android, and Progressive Web Apps using [Capacitor](https://capacitorjs.com/).

Note: previous versions of this tool supported Cordova but Cordova support has been removed as of `1.x`. We strongly recommend teams [migrate to Capacitor](https://capacitorjs.com/docs/cordova/migrating-from-cordova-to-capacitor).

## Install

```bash
$ npm install -g @capacitor/assets
```

## Usage

The tool expects a `resources` folder to exist in the root of the project with the following structure:

```
resources/
├── icon.png
├── icon.png
└── splash-dark.png
```

- `resources/icon.(png|jpg)` must be at least 1024×1024px
- `resources/splash[-dark].(png|jpg)` must be at least 2732×2732px

To generate resources with all the default options, just run:

```bash
$ capacitor-assets
```

`capacitor-assets` accepts a platform for the first argument. If specified, resources are generated only for that platform:

```bash
$ capacitor-assets ios
```

Otherwise `capacitor-assets` will use all detected Capacitor platforms.

#### Documentation

See the help documentation on the command line with the `--help` flag.

```bash
$ capacitor-res --help
```

### Adaptive Icons

Android [Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive) are also supported. If you choose to use them, create the following additional file(s):

- `resources/android/icon-foreground.png` must be at least 432×432px
- `resources/android/icon-background.png` must be at least 432×432px

A color may also be used for the icon background by specifying the `--icon-background-source` option with a hex color code, e.g. `--icon-background-source '#FFFFFF'`.

Regular Android icons will still be generated as a fallback for Android devices that do not support adaptive icons.

### Tips

#### .gitignore

To avoid committing large generated images to your repository, you can add the
following lines to your `.gitignore`:

```
resources/android/icon
resources/android/splash
resources/ios/icon
resources/ios/splash
resources/windows/icon
resources/windows/splash
```

### Programmatic API

`capacitor-res` can be used programmatically.

#### CommonJS Example

```js
const run = require('@capacitor/assets');

await run();
```

#### TypeScript Example

`run()` takes an options object described by the interface `Options`. If options are provided, resources are generated in an explicit, opt-in manner. In the following example, only Android icons and iOS splash screens are generated.

```ts
import { Options, run } from '@capacitor/assets';

const options: Options = {
  directory: '/path/to/project',
  resourcesDirectory: 'resources',
  logstream: process.stdout, // Any WritableStream
  platforms: {
    android: { icon: { sources: ['resources/icon.png'] } },
    ios: { splash: { sources: ['resources/splash.png'] } },
  },
};

await run(options);
```
