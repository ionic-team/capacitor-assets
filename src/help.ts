const help = `
  Usage: cordova-res [ios|android] [options]

    Generate Cordova resources for one or all platforms.

  Options:

    --type <icon|splash> ..... Only generate one type of resource
    --icon-source <path> ..... Use specified file for icon source image
    --splash-source <path> ... Use specified file for splash source image

    -h, --help ............... Print help for the platform, then quit
    --version ................ Print version, then quit
    --verbose ................ Print verbose output to stderr

`;

export async function run() {
  process.stdout.write(help);
}
