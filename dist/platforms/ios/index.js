"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IosAssetGenerator = exports.IOS_SPLASH_IMAGE_SET_PATH = exports.IOS_SPLASH_IMAGE_SET_NAME = exports.IOS_APP_ICON_SET_PATH = exports.IOS_APP_ICON_SET_NAME = void 0;
const tslib_1 = require("tslib");
const utils_fs_1 = require("@ionic/utils-fs");
const path_1 = require("path");
const sharp_1 = tslib_1.__importDefault(require("sharp"));
const asset_generator_1 = require("../../asset-generator");
const error_1 = require("../../error");
const output_asset_1 = require("../../output-asset");
const assets_1 = require("./assets");
const IosAssetTemplates = tslib_1.__importStar(require("./assets"));
exports.IOS_APP_ICON_SET_NAME = 'AppIcon';
exports.IOS_APP_ICON_SET_PATH = `App/Assets.xcassets/${exports.IOS_APP_ICON_SET_NAME}.appiconset`;
exports.IOS_SPLASH_IMAGE_SET_NAME = 'Splash';
exports.IOS_SPLASH_IMAGE_SET_PATH = `App/Assets.xcassets/${exports.IOS_SPLASH_IMAGE_SET_NAME}.imageset`;
class IosAssetGenerator extends asset_generator_1.AssetGenerator {
    constructor(options = {}) {
        super(options);
    }
    async generate(asset, project) {
        const iosDir = project.config.ios?.path;
        if (!iosDir) {
            throw new error_1.BadProjectError('No ios project found');
        }
        if (asset.platform !== "any" /* Platform.Any */ && asset.platform !== "ios" /* Platform.Ios */) {
            return [];
        }
        switch (asset.kind) {
            case "logo" /* AssetKind.Logo */:
            case "logo-dark" /* AssetKind.LogoDark */:
                return this.generateFromLogo(asset, project);
            case "icon" /* AssetKind.Icon */:
                return this.generateIcons(asset, project);
            case "icon-dark" /* AssetKind.IconDark */:
                return this._generateIcons(asset, project, [IosAssetTemplates.IOS_1024_ICON_DARK]);
            case "icon-tinted" /* AssetKind.IconTinted */:
                return this._generateIcons(asset, project, [IosAssetTemplates.IOS_1024_ICON_TINTED]);
            case "splash" /* AssetKind.Splash */:
            case "splash-dark" /* AssetKind.SplashDark */:
                return this.generateSplashes(asset, project);
        }
        return [];
    }
    /**
     * The icon templates to generate from a primary (light) icon source.
     * Dark/tinted variants are auto-derived unless the project provides
     * explicit ios/icon-dark or ios/icon-tinted sources, which are then
     * generated in their own pass.
     */
    iconTemplates(project) {
        const icons = Object.values(IosAssetTemplates).filter((a) => a.kind === "icon" /* AssetKind.Icon */);
        return icons.filter((icon) => {
            if (icon.appearance === "dark" /* IosIconAppearance.Dark */ && project.assets?.iosIconDark) {
                return false;
            }
            if (icon.appearance === "tinted" /* IosIconAppearance.Tinted */ && project.assets?.iosIconTinted) {
                return false;
            }
            return true;
        });
    }
    async generateFromLogo(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const iosDir = project.config.ios?.path ?? 'App';
        // Generate logos
        let logos = [];
        if (asset.kind === "logo" /* AssetKind.Logo */) {
            logos = await this.generateIconsForLogo(asset, project);
        }
        const generated = [];
        const targetLogoWidthPercent = this.options.logoSplashScale ?? 0.2;
        const targetWidth = this.options.logoSplashTargetWidth ?? Math.floor((asset.width ?? 0) * targetLogoWidthPercent);
        if (asset.kind === "logo" /* AssetKind.Logo */) {
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
                        width: lightSplash.width ?? 0,
                        height: lightSplash.height ?? 0,
                        channels: 4,
                        background: this.options.splashBackgroundColor ?? lightDefaultBackground,
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
                    width: darkSplash.width ?? 0,
                    height: darkSplash.height ?? 0,
                    channels: 4,
                    background: this.options.splashBackgroundColorDark ?? darkDefaultBackground,
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
        if (!asset.pipeline()) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const iosDir = project.config.ios?.path ?? 'App';
        const lightDefaultBackground = '#ffffff';
        // True when the source is an explicit ios/icon-dark or ios/icon-tinted
        // file, in which case the user's art is used as-is (no derivation).
        const explicitVariant = asset.kind === "icon-dark" /* AssetKind.IconDark */ || asset.kind === "icon-tinted" /* AssetKind.IconTinted */;
        const generated = await Promise.all(icons.map(async (icon) => {
            const dest = (0, path_1.join)(iosDir, exports.IOS_APP_ICON_SET_PATH, icon.name);
            const appearance = icon.appearance ?? "any" /* IosIconAppearance.Any */;
            // When deriving the dark variant while generating from a logo,
            // prefer the dark logo if one was provided.
            let sourcePath = asset.path;
            if (appearance === "dark" /* IosIconAppearance.Dark */ && asset.kind === "logo" /* AssetKind.Logo */ && project.assets?.logoDark) {
                sourcePath = project.assets.logoDark.path;
            }
            const pipe = (0, sharp_1.default)(sourcePath).resize(icon.width, icon.height);
            if (appearance === "dark" /* IosIconAppearance.Dark */) {
                // Dark icons keep their transparency so the system-provided
                // dark background shows through.
            }
            else if (appearance === "tinted" /* IosIconAppearance.Tinted */) {
                // Tinted icons must be fully opaque grayscale.
                pipe.flatten({ background: this.options.iconBackgroundColor ?? lightDefaultBackground });
                if (!explicitVariant) {
                    pipe.greyscale();
                }
            }
            else {
                pipe.flatten({ background: this.options.iconBackgroundColor ?? lightDefaultBackground });
            }
            const outputInfo = await pipe.png().toFile(dest);
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
        return this._generateIcons(asset, project, this.iconTemplates(project));
    }
    async generateIcons(asset, project) {
        return this._generateIcons(asset, project, this.iconTemplates(project));
    }
    async generateSplashes(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const assetMetas = asset.kind === "splash" /* AssetKind.Splash */
            ? [assets_1.IOS_1X_UNIVERSAL_ANYANY_SPLASH, assets_1.IOS_2X_UNIVERSAL_ANYANY_SPLASH, assets_1.IOS_3X_UNIVERSAL_ANYANY_SPLASH]
            : [
                assets_1.IOS_1X_UNIVERSAL_ANYANY_SPLASH_DARK,
                assets_1.IOS_2X_UNIVERSAL_ANYANY_SPLASH_DARK,
                assets_1.IOS_3X_UNIVERSAL_ANYANY_SPLASH_DARK,
            ];
        const generated = [];
        for (const assetMeta of assetMetas) {
            const iosDir = project.config.ios?.path ?? 'App';
            const dest = (0, path_1.join)(iosDir, exports.IOS_SPLASH_IMAGE_SET_PATH, assetMeta.name);
            const outputInfo = await pipe.resize(assetMeta.width, assetMeta.height).png().toFile(dest);
            const g = new output_asset_1.OutputAsset(assetMeta, asset, project, {
                [assetMeta.name]: dest,
            }, {
                [assetMeta.name]: outputInfo,
            });
            generated.push(g);
        }
        if (asset.kind === "splash" /* AssetKind.Splash */) {
            await this.updateSplashContentsJson(generated, project);
        }
        else if (asset.kind === "splash-dark" /* AssetKind.SplashDark */) {
            // Need to register this as a dark-mode splash
            await this.updateSplashContentsJsonDark(generated, project);
        }
        return generated;
    }
    async updateIconsContentsJson(generated, project) {
        const assetsPath = (0, path_1.join)(project.config.ios?.path ?? 'App', exports.IOS_APP_ICON_SET_PATH);
        const contentsJsonPath = (0, path_1.join)(assetsPath, 'Contents.json');
        const json = await (0, utils_fs_1.readFile)(contentsJsonPath, { encoding: 'utf-8' });
        const parsed = JSON.parse(json);
        // The luminosity appearance of a Contents.json image entry ('any' when absent)
        const appearanceOf = (entry) => entry?.appearances?.find((a) => a.appearance === 'luminosity')?.value ?? "any" /* IosIconAppearance.Any */;
        let images = (parsed.images ?? []).filter((i) => !!i.filename);
        for (const g of generated) {
            const template = g.template;
            const appearance = template.appearance ?? "any" /* IosIconAppearance.Any */;
            // Replace any existing entries for this appearance, removing files
            // they referenced (e.g. legacy multi-size icons from older projects)
            for (const existing of images.filter((i) => appearanceOf(i) === appearance)) {
                if (existing.filename !== template.name) {
                    (0, utils_fs_1.rmSync)((0, path_1.join)(assetsPath, existing.filename), { force: true });
                }
            }
            images = images.filter((i) => appearanceOf(i) !== appearance);
            const entry = {
                idiom: template.idiom,
                size: `${template.width}x${template.height}`,
                filename: template.name,
                platform: "ios" /* Platform.Ios */,
            };
            if (appearance !== "any" /* IosIconAppearance.Any */) {
                entry.appearances = [{ appearance: 'luminosity', value: appearance }];
            }
            images.push(entry);
        }
        parsed.images = images;
        await (0, utils_fs_1.writeFile)(contentsJsonPath, JSON.stringify(parsed, null, 2));
    }
    async updateSplashContentsJson(generated, project) {
        const contentsJsonPath = (0, path_1.join)(project.config.ios?.path ?? 'App', exports.IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json');
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
                    scale: `${g.template.scale ?? 1}x`,
                    filename: g.template.name,
                });
            }
        }
        parsed.images = withoutMissing;
        await (0, utils_fs_1.writeFile)(contentsJsonPath, JSON.stringify(parsed, null, 2));
    }
    async updateSplashContentsJsonDark(generated, project) {
        const contentsJsonPath = (0, path_1.join)(project.config.ios?.path ?? 'App', exports.IOS_SPLASH_IMAGE_SET_PATH, 'Contents.json');
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
                    scale: `${g.template.scale ?? 1}x`,
                    filename: g.template.name,
                });
            }
        }
        parsed.images = withoutMissing;
        await (0, utils_fs_1.writeFile)(contentsJsonPath, JSON.stringify(parsed, null, 2));
    }
}
exports.IosAssetGenerator = IosAssetGenerator;
