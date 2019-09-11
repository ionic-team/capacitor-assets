# Resource Generator

This tool will crop and resize JPEG and PNG source images to generate images for modern iOS and Android devices. It will also register the generated images in `config.xml` so that Cordova projects are updated accordingly.

## Install

```bash
$ npm install -g cordova-res
```

## Usage

`cordova-res` must run at the root of a Cordova project, such as:

```
resources/
├── icon.png
└── splash.png
config.xml
```

* `resources/icon.png` must be at least 1024×1024px
* `resources/splash.png` must be at least 2732×2732px

To generate resources with all the default options, just run:

```bash
$ cordova-res
```

`cordova-res` accepts a platform for the first argument. If specified, resources are generated only for that platform:

```bash
$ cordova-res ios
```

Otherwise, `cordova-res` looks for platforms in `config.xml` (e.g. `<platform name="ios">`) and generates resources only for them.

#### Documentation

See the help documentation on the command line with the `--help` flag.

```bash
$ cordova-res --help
```

### Adaptive Icons

Android [Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive) are also supported. If you choose to use them, create the following additional file(s):

* `resources/android/icon-foreground.png` must be at least 432×432px
* `resources/android/icon-background.png` must be at least 432×432px

A color may also be used for the icon background by specifying the `--icon-background-source` option with a hex color code, e.g. `--icon-background-source '#FFFFFF'`.

Regular Android icons will still be generated as a fallback for Android devices that do not support adaptive icons.

:memo: **Note**: Cordova 9+ and `cordova-android` 8+ is required.

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

`cordova-res` can be used programmatically.

#### CommonJS Example

```js
const run = require('cordova-res');

await run();
```

#### TypeScript Example

`run()` takes an options object described by the interface `Options`. If options are provided, resources are generated in an explicit, opt-in manner. In the following example, only Android icons and iOS splash screens are generated.

```ts
import { Options, run } from 'cordova-res';

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

### Cordova Reference Documentation

- Icons: https://cordova.apache.org/docs/en/latest/config_ref/images.html
- Splash Screens: https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-splashscreen/
