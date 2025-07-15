"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IosAssetGenerator = exports.IOS_SPLASH_IMAGE_SET_PATH = exports.IOS_SPLASH_IMAGE_SET_NAME = exports.IOS_APP_ICON_SET_PATH = exports.IOS_APP_ICON_SET_NAME = void 0;
const tslib_1 = require("tslib");
const utils_fs_1 = require("@ionic/utils-fs");
const path_1 = require("path");
const sharp_1 = (0, tslib_1.__importDefault)(require("sharp"));
const asset_generator_1 = require("../../asset-generator");
const error_1 = require("../../error");
const output_asset_1 = require("../../output-asset");
const assets_1 = require("./assets");
const IosAssetTemplates = (0, tslib_1.__importStar)(require("./assets"));
exports.IOS_APP_ICON_SET_NAME = 'AppIcon';
exports.IOS_APP_ICON_SET_PATH = `App/Assets.xcassets/${exports.IOS_APP_ICON_SET_NAME}.appiconset`;
exports.IOS_SPLASH_IMAGE_SET_NAME = 'Splash';
exports.IOS_SPLASH_IMAGE_SET_PATH = `App/Assets.xcassets/${exports.IOS_SPLASH_IMAGE_SET_NAME}.imageset`;
class IosAssetGenerator extends asset_generator_1.AssetGenerator {
    constructor(options = {}) {
        super(options);
    }
    async generate(asset, project) {
        var _a;
        const iosDir = (_a = project.config.ios) === null || _a === void 0 ? void 0 : _a.path;
        if (!iosDir) {
            throw new error_1.BadProjectError('No ios project found');
        }
        if (asset.platform !== "any" /* Any */ && asset.platform !== "ios" /* Ios */) {
            return [];
        }
        switch (asset.kind) {
            case "logo" /* Logo */:
            case "logo-dark" /* LogoDark */:
                return this.generateFromLogo(asset, project);
            case "icon" /* Icon */:
                return this.generateIcons(asset, project);
            case "splash" /* Splash */:
            case "splash-dark" /* SplashDark */:
                return this.generateSplashes(asset, project);
        }
        return [];
    }
    async generateFromLogo(asset, project) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const iosDir = project.config.ios.path;
        // Generate logos
        let logos = [];
        if (asset.kind === "logo" /* Logo */) {
            logos = await this.generateIconsForLogo(asset, project);
        }
        const generated = [];
        const targetLogoWidthPercent = (_a = this.options.logoSplashScale) !== null && _a !== void 0 ? _a : 0.2;
        const targetWidth = (_b = this.options.logoSplashTargetWidth) !== null && _b !== void 0 ? _b : Math.floor(((_c = asset.width) !== null && _c !== void 0 ? _c : 0) * targetLogoWidthPercent);
        if (asset.kind === "logo" /* Logo */) {
            // Generate light splash
            const lightDefaultBackground = '#ffffff';
            const lightSplashes = [
                assets_1.IOS_1X_UNIVERSAL_ANYANY_SPLASH,
                assets_1.IOS_2X_UNIVERSAL_ANYANY_SPLASH,
                assets_1.IOS_3X_UNIVERSAL_ANYANY_SPLASH,
            ];
            const lightSplashesGenerated = [];
            for (const lightSplash of lightSplashes) {
                const lightDest = (0, path_1.join)(iosDir, exports.IOS_SPLASH_IMAGE_SET_PATH, lightSplash.name);
                const canvas = (0, sharp_1.default)({
                    create: {
                        width: (_d = lightSplash.width) !== null && _d !== void 0 ? _d : 0,
                        height: (_e = lightSplash.height) !== null && _e !== void 0 ? _e : 0,
                        channels: 4,
                        background: (_f = this.options.splashBackgroundColor) !== null && _f !== void 0 ? _f : lightDefaultBackground,
                    },
                });
                const resized = await (0, sharp_1.default)(asset.path).resize(targetWidth).toBuffer();
                const lightOutputInfo = await canvas
                    .composite([{ input: resized, gravity: sharp_1.default.gravity.center }])
                    .png()
                    .toFile(lightDest);
                const lightSplashOutput = new output_asset_1.OutputAsset(lightSplash, asset, project, {
                    [lightDest]: lightDest,
                }, {
                    [lightDest]: lightOutputInfo,
                });
                generated.push(lightSplashOutput);
                lightSplashesGenerated.push(lightSplashOutput);
            }
            await this.updateSplashContentsJson(lightSplashesGenerated, project);
        }
        // Generate dark splash
        const darkDefaultBackground = '#111111';
        const darkSplashes = [
            assets_1.IOS_1X_UNIVERSAL_ANYANY_SPLASH_DARK,
            assets_1.IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
            assets_1.IOS_3X_UNIVERSAL_ANYANY_SPLASH_DARK,
        ];
        const darkSplashesGenerated = [];
        for (const darkSplash of darkSplashes) {
            const darkDest = (0, path_1.join)(iosDir, exports.IOS_SPLASH_IMAGE_SET_PATH, darkSplash.name);
            const canvas = (0, sharp_1.default)({
                create: {
                    width: (_g = darkSplash.width) !== null && _g !== void 0 ? _g : 0,
                    height: (_h = darkSplash.height) !== null && _h !== void 0 ? _h : 0,
                    channels: 4,
                    background: (_j = this.options.splashBackgroundColorDark) !== null && _j !== void 0 ? _j : darkDefaultBackground,
                },
            });
            const resized = await (0, sharp_1.default)(asset.path).resize(targetWidth).toBuffer();
            const darkOutputInfo = await canvas
                .composite([{ input: resized, gravity: sharp_1.default.gravity.center }])
                .png()
                .toFile(darkDest);
            const darkSplashOutput = new output_asset_1.OutputAsset(darkSplash, asset, project, {
                [darkDest]: darkDest,
            }, {
                [darkDest]: darkOutputInfo,
            });
            generated.push(darkSplashOutput);
            darkSplashesGenerated.push(darkSplashOutput);
        }
        await this.updateSplashContentsJsonDark(darkSplashesGenerated, project);
        return [...logos, ...generated];
    }
    async _generateIcons(asset, project, icons) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const iosDir = project.config.ios.path;
        const lightDefaultBackground = '#ffffff';
        const generated = await Promise.all(icons.map(async (icon) => {
            var _a;
            const dest = (0, path_1.join)(iosDir, exports.IOS_APP_ICON_SET_PATH, icon.name);
            const outputInfo = await pipe
                .resize(icon.width, icon.height)
                .png()
                .flatten({ background: (_a = this.options.iconBackgroundColor) !== null && _a !== void 0 ? _a : lightDefaultBackground })
                .toFile(dest);
            return new output_asset_1.OutputAsset(icon, asset, project, {
                [icon.name]: dest,
            }, {
                [icon.name]: outputInfo,
            });
        }));
        await this.updateIconsContentsJson(generated, project);
        return generated;
    }
    // Generate ALL the icons when only given a logo
    async generateIconsForLogo(asset, project) {
        const icons = Object.values(IosAssetTemplates).filter((a) => ["icon" /* Icon */].find((i) => i === a.kind));
        return this._generateIcons(asset, project, icons);
    }
    async generateIcons(asset, project) {
        const icons = Object.values(IosAssetTemplates).filter((a) => ["icon" /* Icon */].find((i) => i === a.kind));
        return this._generateIcons(asset, project, icons);
    }
    async generateSplashes(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const assetMetas = asset.kind === "splash" /* Splash */
            ? [assets_1.IOS_1X_UNIVERSAL_ANYANY_SPLASH, assets_1.IOS_2X_UNIVERSAL_ANYANY_SPLASH, assets_1.IOS_3X_UNIVERSAL_ANYANY_SPLASH]
            : [
                assets_1.IOS_1X_UNIVERSAL_ANYANY_SPLASH_DARK,
                assets_1.IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
                assets_1.IOS_3X_UNIVERSAL_ANYANY_SPLASH_DARK,
            ];
        const generated = [];
        for (const assetMeta of assetMetas) {
            const iosDir = project.config.ios.path;
            const dest = (0, path_1.join)(iosDir, exports.IOS_SPLASH_IMAGE_SET_PATH, assetMeta.name);
            const outputInfo = await pipe.resize(assetMeta.width, assetMeta.height).png().toFile(dest);
            const g = new output_asset_1.OutputAsset(assetMeta, asset, project, {
                [assetMeta.name]: dest,
            }, {
                [assetMeta.name]: outputInfo,
            });
            generated.push(g);
        }
        if (asset.kind === "splash" /* Splash */) {
            await this.updateSplashContentsJson(generated, project);
        }
        else if (asset.kind === "splash-dark" /* SplashDark */) {
            // Need to register this as a dark-mode splash
            await this.updateSplashContentsJsonDark(generated, project);
        }
        return generated;
    }
    async updateIconsContentsJson(generated, project) {
        const assetsPath = (0, path_1.join)(project.config.ios.path, exports.IOS_APP_ICON_SET_PATH);
        const contentsJsonPath = (0, path_1.join)(assetsPath, 'Contents.json');
        const json = await (0, utils_fs_1.readFile)(contentsJsonPath, { encoding: 'utf-8' });
        const parsed = JSON.parse(json);
        const withoutMissing = [];
        for (const g of generated) {
            const width = g.template.width;
            const height = g.template.height;
            parsed.images.map((i) => {
                if (i.filename !== g.template.name) {
                    (0, utils_fs_1.rmSync)((0, path_1.join)(assetsPath, i.filename));
                }
            });
            withoutMissing.push({
                idiom: g.template.idiom,
                size: `${width}x${height}`,
                filename: g.template.name,
                platform: "ios" /* Ios */,
            });
        }
        parsed.images = withoutMissing;
        await (0, utils_fs_1.writeFile)(contentsJsonPath, JSON.stringify(parsed, null, 2));
    }
    async updateSplashContentsJson(generated, project) {
        var _a;
        const contentsJsonPath = (0, path_1.join)(project.config.ios.path, exports.IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json');
        const json = await (0, utils_fs_1.readFile)(contentsJsonPath, { encoding: 'utf-8' });
        const parsed = JSON.parse(json);
        const withoutMissing = parsed.images.filter((i) => !!i.filename);
        for (const g of generated) {
            const existing = withoutMissing.find((f) => f.scale === `${g.template.scale}x` && f.idiom === 'universal' && typeof f.appearances === 'undefined');
            if (existing) {
                existing.filename = g.template.name;
            }
            else {
                withoutMissing.push({
                    idiom: 'universal',
                    scale: `${(_a = g.template.scale) !== null && _a !== void 0 ? _a : 1}x`,
                    filename: g.template.name,
                });
            }
        }
        parsed.images = withoutMissing;
        await (0, utils_fs_1.writeFile)(contentsJsonPath, JSON.stringify(parsed, null, 2));
    }
    async updateSplashContentsJsonDark(generated, project) {
        var _a;
        const contentsJsonPath = (0, path_1.join)(project.config.ios.path, exports.IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json');
        const json = await (0, utils_fs_1.readFile)(contentsJsonPath, { encoding: 'utf-8' });
        const parsed = JSON.parse(json);
        const withoutMissing = parsed.images.filter((i) => !!i.filename);
        for (const g of generated) {
            const existing = withoutMissing.find((f) => f.scale === `${g.template.scale}x` && f.idiom === 'universal' && typeof f.appearances !== 'undefined');
            if (existing) {
                existing.filename = g.template.name;
            }
            else {
                withoutMissing.push({
                    appearances: [
                        {
                            appearance: 'luminosity',
                            value: 'dark',
                        },
                    ],
                    idiom: 'universal',
                    scale: `${(_a = g.template.scale) !== null && _a !== void 0 ? _a : 1}x`,
                    filename: g.template.name,
                });
            }
        }
        parsed.images = withoutMissing;
        await (0, utils_fs_1.writeFile)(contentsJsonPath, JSON.stringify(parsed, null, 2));
    }
}
exports.IosAssetGenerator = IosAssetGenerator;
