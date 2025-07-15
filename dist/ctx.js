"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setArguments = exports.loadContext = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const yargs_1 = (0, tslib_1.__importDefault)(require("yargs"));
const helpers_1 = require("yargs/helpers");
const project_1 = require("./project");
async function loadContext(projectRootPath) {
    var _a;
    const rootDir = process.cwd();
    const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv)).argv;
    let project;
    try {
        project = await loadProject(argv, projectRootPath, (_a = argv.assetPath) !== null && _a !== void 0 ? _a : 'assets');
    }
    catch (e) {
        throw new Error(`Unable to load project: ${e.message}`);
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
exports.loadContext = loadContext;
function setArguments(ctx, args) {
    ctx.args = args;
    process.env.VERBOSE = '' + !!args.verbose;
}
exports.setArguments = setArguments;
async function loadProject(args, projectRootPath, projectAssetPath) {
    const config = await loadMobileProjectConfig(args);
    const project = new project_1.Project(projectRootPath, config, projectAssetPath);
    await project.load();
    return project;
}
// TODO: Use the config loading stuff from @capacitor/configure
function loadMobileProjectConfig(args) {
    var _a, _b;
    return {
        ios: {
            path: (_a = args.iosProject) !== null && _a !== void 0 ? _a : 'ios/App',
        },
        android: {
            path: (_b = args.androidProject) !== null && _b !== void 0 ? _b : 'android',
        },
    };
}
