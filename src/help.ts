import {
  DEFAULT_FIT,
  DEFAULT_POSITION,
  DEFAULT_RESOURCES_DIRECTORY,
} from './cli';

const help = `
  Usage: cordova-res [ios|android|windows] [options]

    Generate Cordova resources for native platforms.

    This tool writes to 'config.xml' to register resources with Cordova. Valid
    platform definitions are required. See the Cordova docs[1] for more
    information.

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

    [1]: https://cordova.apache.org/docs/en/latest/config_ref/index.html#platform

  Options:

    --type <icon|splash|adaptive-icon> ... Only generate one type of resource
    --resources <path> ................... Use a different resources directory (default: '${DEFAULT_RESOURCES_DIRECTORY}')
    --skip-config ........................ Skip reading/writing to 'config.xml'

    --icon-source <path> ................. Use specified file for icon source image
    --splash-source <path> ............... Use specified file for splash source image
    --icon-foreground-source <path> ...... Use file for foreground of adaptive icon
    --icon-background-source <path|hex> .. Use file or color for background of adaptive icon

    --fit <cover|contain|fill> ........... Specify how to fit the image when resizing (default: '${DEFAULT_FIT}')
    --position <position> ................ Specify how to position the image when resizing (default: '${DEFAULT_POSITION}')
                                           (positions: 'center', 'top', 'right top', 'right', 'right bottom',
                                                       'bottom', 'left bottom', 'left', 'left top')

    --copy ............................... Copy generated resources to native projects
    --ios-project <path> ................. Use specified directory for iOS native project (default: 'ios')
    --android-project <path> ............. Use specified directory for Android native project (default: 'android')

    -h, --help ........................... Print help for the platform, then quit
    -v, --version ........................ Print version, then quit
    --verbose ............................ Print verbose output to stderr
`;

export async function run(): Promise<void> {
  process.stdout.write(`${help}\n`);
}
