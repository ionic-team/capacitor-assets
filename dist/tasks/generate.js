"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tslib_1 = require("tslib");
const c = (0, tslib_1.__importStar)(require("../colors"));
const android_1 = require("../platforms/android");
const ios_1 = require("../platforms/ios");
const pwa_1 = require("../platforms/pwa");
const log_1 = require("../util/log");
async function run(ctx) {
    try {
        if (!(await ctx.project.assetDirExists())) {
            (0, log_1.error)(`Asset directory not found at ${ctx.project.projectRoot}. Use --asset-path to specify a specific directory containing assets`);
            return [];
        }
        const assets = await ctx.project.loadInputAssets();
        if ([assets.logo, assets.icon, assets.splash, assets.splashDark].every((a) => !a)) {
            (0, log_1.error)(`No assets found in the asset path ${c.ancillary(ctx.project.assetDir)}. See https://github.com/ionic-team/capacitor-assets to learn how to use this tool.`);
            return [];
        }
        let platforms = ['ios', 'android', 'pwa'];
        if (ctx.args.ios || ctx.args.android || ctx.args.pwa) {
            platforms = [];
        }
        if (ctx.args.ios) {
            platforms.push('ios');
        }
        if (ctx.args.android) {
            platforms.push('android');
        }
        if (ctx.args.pwa) {
            platforms.push('pwa');
        }
        await verifyPlatformFolders(/* mut */ platforms, ctx.project);
        if (platforms.length > 0) {
            if (!ctx.args.silent) {
                (0, log_1.log)(`Generating assets for ${platforms.map((p) => c.strong(c.success(p))).join(', ')}`);
            }
            const generators = getGenerators(ctx, platforms);
            const generated = await generateAssets(assets, generators, ctx.project);
            if (!ctx.args.silent) {
                logGenerated(generated);
            }
            /*
            if (!ctx.args.silent && platforms.indexOf('pwa') >= 0 && ctx.args.pwaTags) {
              PwaAssetGenerator.logInstructions(generated);
            }
            */
            return generated;
        }
        else {
            log_1.logger.warn('No platforms found, exiting');
            return [];
        }
    }
    catch (e) {
        (0, log_1.error)('Unable to generate assets', e.message);
        (0, log_1.error)(e);
    }
    return [];
}
exports.run = run;
async function verifyPlatformFolders(platforms, project) {
    var _a, _b;
    if (platforms.indexOf('ios') >= 0 && !(await project.iosExists())) {
        platforms.splice(platforms.indexOf('ios'), 1);
        log_1.logger.warn(`iOS platform not found at ${((_a = project.config.ios) === null || _a === void 0 ? void 0 : _a.path) || ''}, skipping iOS generation`);
    }
    if (platforms.indexOf('android') >= 0 && !(await project.androidExists())) {
        platforms.splice(platforms.indexOf('android'), 1);
        log_1.logger.warn(`Android platform not found at ${((_b = project.config.android) === null || _b === void 0 ? void 0 : _b.path) || ''}, skipping android generation`);
    }
}
async function generateAssets(assets, generators, project) {
    const generated = [];
    async function generateAndCollect(asset) {
        const g = await Promise.all(generators.map((g) => asset.generate(g, project)));
        generated.push(...g.flat().filter((f) => !!f));
    }
    const assetTypes = Object.values(assets).filter((v) => !!v);
    for (const asset of assetTypes) {
        await generateAndCollect(asset);
    }
    return generated;
}
function getGenerators(ctx, platforms) {
    return platforms.map((p) => {
        if (p === 'ios') {
            return new ios_1.IosAssetGenerator(ctx.args);
        }
        if (p === 'android') {
            return new android_1.AndroidAssetGenerator(ctx.args);
        }
        if (p === 'pwa') {
            return new pwa_1.PwaAssetGenerator(ctx.args);
        }
    });
}
// Print out a nice report of the assets generated
// and totals per platform
function logGenerated(generated) {
    const sorted = generated.slice().sort((a, b) => {
        return a.template.platform.localeCompare(b.template.platform);
    });
    for (const g of sorted) {
        Object.keys(g.destFilenames).forEach((name) => {
            const filename = g.getDestFilename(name);
            const outputInfo = g.getOutputInfo(name);
            (0, log_1.log)(`${c.strong(c.success('CREATE'))} ${c.strong(c.extra(g.template.platform))} ${c.weak(g.template.kind)} ${filename !== null && filename !== void 0 ? filename : ''}${outputInfo ? ` (${size(outputInfo.size)})` : ''}`);
        });
    }
    (0, log_1.log)('\n');
    // Aggregate total assets and size per platform
    const totals = sorted.reduce((totals, g) => {
        if (!(g.template.platform in totals)) {
            totals[g.template.platform] = {
                count: 0,
                size: 0,
            };
        }
        const entry = totals[g.template.platform];
        const count = Object.values(g.destFilenames).reduce((v) => v + 1, 0);
        const size = Object.values(g.outputInfoMap).reduce((v, c) => v + c.size, 0);
        totals[g.template.platform] = {
            count: entry.count + count,
            size: entry.size + size,
        };
        return totals;
    }, {});
    (0, log_1.log)('Totals:');
    for (const platformName of Object.keys(totals).sort()) {
        const e = totals[platformName];
        (0, log_1.log)(`${c.strong(c.success(platformName))}: ${c.strong(c.extra(e.count))} generated, ${c.strong(size(e.size))} total`);
    }
}
function size(bytes) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Number((bytes / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
}
