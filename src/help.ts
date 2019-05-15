const help = `
  Usage: cordova-res [ios|android] [options]

    Generate Cordova resources for one or all platforms.

    Without specifying options for source images, this tool will look for
    'icon.(png|jpg)' and 'splash.(png|jpg)' files inside 'resources/'. To use
    'res/' for the resources directory, specify '--resources res'.

    To generate platform-specific icons and splash screens, place source images
    in the platform's directory, e.g. 'resources/ios/icon.png'.

    Android Adaptive Icons are supported. The foreground must be an image, but
    the background can be an image or a color. To use a color for the
    background, specify a hex color, e.g. '--icon-background-source #FF0000'.

    To use adaptive icons, place 'icon-foreground.(png|jpg)' and (optionally)
    'icon-background.(png|jpg)' source images in 'resources/android/'. If a
    foreground image is found, regular Android icons are not generated.

  Options:

    --type <icon|splash> ................. Only generate one type of resource
    --icon-source <path> ................. Use specified file for icon source image
    --icon-foreground-source <path> ...... Use file for foreground of adaptive icon
    --icon-background-source <path|hex> .. Use file or color for background of adaptive icon
    --splash-source <path> ............... Use specified file for splash source image
    --resources <path> ................... Use specified directory as resources directory

    -h, --help ........................... Print help for the platform, then quit
    --version ............................ Print version, then quit
    --verbose ............................ Print verbose output to stderr

`;

export async function run() {
  process.stdout.write(help);
}
