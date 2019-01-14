const help = `
  Usage: cordova-res [ios|android] [options]

  Options:

    -h, --help ........... Print help for the platform, then quit
    --version ............ Print version, then quit
    --verbose ............ Print verbose output to stderr

`;

export async function run() {
  process.stdout.write(help);
}
