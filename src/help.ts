const help = `
  Usage: cordova-res [ios|android] [options]

    Generate Cordova resources for one or all platforms.

    By default, this tool will look for 'icon.(png|jpg)' and 'splash.(png|jpg)'
    files inside 'resources/'. If an 'icon-foreground.(png|jpg)' file is found
    inside 'resources/android/', Adaptive Icons will be generated for Android.

    To generate platform-specific icons and splash screens, place source images
    in the platform's directory, e.g. 'resources/ios/icon.png'.

    The resources directory is configurable with the '--resources' option. For
    example, to use 'res/' for the resources directory, specify '--resources res'.

    For Android Adaptive Icons, the foreground must be an image, but the
    background may be an image or a color. To use an image, place an
    'icon-background.(png|jpg)' file in 'resources/android/'. To use a color,
    specify a hex color, e.g. '--icon-background-source #FF0000'.

  Options:

    --type <icon|splash|adaptive-icon> ... Only generate one type of resource
    --resources <path> ................... Use specified directory as resources directory

    --icon-source <path> ................. Use specified file for icon source image
    --splash-source <path> ............... Use specified file for splash source image
    --icon-foreground-source <path> ...... Use file for foreground of adaptive icon
    --icon-background-source <path|hex> .. Use file or color for background of adaptive icon

    -h, --help ........................... Print help for the platform, then quit
    --version ............................ Print version, then quit
    --verbose ............................ Print verbose output to stderr
`;

export async function run() {
  process.stdout.write(`${help}\n`);
}
