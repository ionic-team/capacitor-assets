"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadContext = loadContext;
exports.setArguments = setArguments;
const tslib_1 = require("tslib");
const path_1 = require("path");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const project_1 = require("./project");
async function loadContext(projectRootPath) {
    const rootDir = process.cwd();
    const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv)).parseSync();
    let project;
    try {
        project = await loadProject(argv, projectRootPath, argv.assetPath ?? 'assets');
    }
    catch (e) {
        throw new Error(`Unable to load project: ${e.message}`, { cause: e });
    }
    return {
        args: argv,
        project,
        projectRootPath,
        // Important for resolving custom prettier plugin
        nodePackageRoot: (0, path_1.join)(__dirname, '../../'),
        rootDir,
    };
}
function setArguments(ctx, args) {
    ctx.args = args;
    process.env.VERBOSE = '' + !!args.verbose;
}
async function loadProject(args, projectRootPath, projectAssetPath) {
    const config = await loadMobileProjectConfig(args);
    const project = new project_1.Project(projectRootPath, config, projectAssetPath);
    await project.load();
    return project;
}
// TODO: Use the config loading stuff from @capacitor/configure
function loadMobileProjectConfig(args) {
    return {
        ios: {
            path: args.iosProject ?? 'ios/App',
        },
        android: {
            path: args.androidProject ?? 'android',
        },
    };
}
