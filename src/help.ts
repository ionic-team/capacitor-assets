const help = `
  Usage: cordova-res [ios|android] [options]

    Generate Cordova resources for one or all platforms.

    Without specifying options for source images, this tool will look for
    'icon.(png|jpg)' and 'splash.(png|jpg)' files inside 'resources/'. To use
    'res/' for the resources directory, specify '--resources res'.

    To generate platform-specific icons and splash screens, place source images
    in the platform's directory, e.g. 'resources/android/icon.png'.

  Options:

    --type <icon|splash> ..... Only generate one type of resource
    --icon-source <path> ..... Use specified file for icon source image
    --splash-source <path> ... Use specified file for splash source image
    --resources <path> ....... Use specified directory as resources directory

    -h, --help ............... Print help for the platform, then quit
    --version ................ Print version, then quit
    --verbose ................ Print verbose output to stderr

`;

export async function run() {
  process.stdout.write(help);
}
