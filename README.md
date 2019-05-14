# Resource Generator

This tool will crop and resize JPEG and PNG source images to generate images for modern iOS and Android devices.

`cordova-res` must run at the root of a Cordova project, such as:

```
resources/
├── icon.png
└── splash.png
config.xml
```

* `resources/icon.png` must be at least 1024×1024px
* `resources/splash.png` must be at least 2732×2732px

## Install

```bash
$ npm install -g cordova-res
```

## Usage

See the help documentation on the command line with the `--help` option.

```bash
$ cordova-res --help
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
