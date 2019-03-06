# Resource Generator

This tool will crop and resize PNG source images to generate images for modern iOS and Android devices.

`cordova-res` must run at the root of a standard Cordova project setup, such as:

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
