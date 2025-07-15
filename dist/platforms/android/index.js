"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidAssetGenerator = void 0;
const tslib_1 = require("tslib");
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const utils_fs_1 = require("@ionic/utils-fs");
const path_1 = require("path");
const sharp_1 = (0, tslib_1.__importDefault)(require("sharp"));
const asset_generator_1 = require("../../asset-generator");
const error_1 = require("../../error");
const output_asset_1 = require("../../output-asset");
const log_1 = require("../../util/log");
const AndroidAssetTemplates = (0, tslib_1.__importStar)(require("./assets"));
class AndroidAssetGenerator extends asset_generator_1.AssetGenerator {
    constructor(options = {}) {
        super(options);
    }
    async generate(asset, project) {
        var _a;
        const androidDir = (_a = project.config.android) === null || _a === void 0 ? void 0 : _a.path;
        if (!androidDir) {
            throw new error_1.BadProjectError('No android project found');
        }
        if (asset.platform !== "any" /* Any */ && asset.platform !== "android" /* Android */) {
            return [];
        }
        switch (asset.kind) {
            case "logo" /* Logo */:
            case "logo-dark" /* LogoDark */:
                return this.generateFromLogo(asset, project);
            case "icon" /* Icon */:
                return this.generateLegacyIcon(asset, project);
            case "icon-foreground" /* IconForeground */:
                return this.generateAdaptiveIconForeground(asset, project);
            case "icon-background" /* IconBackground */:
                return this.generateAdaptiveIconBackground(asset, project);
            case "banner" /* Banner */:
                return this.generateBanners(asset, project);
            case "splash" /* Splash */:
            case "splash-dark" /* SplashDark */:
                return this.generateSplashes(asset, project);
        }
        return [];
    }
    /**
     * Generate from logo combines all of the other operations into a single operation
     * from a single asset source file. In this mode, a logo along with a background color
     * is used to generate all icons and splash screens (with dark mode where possible).
     */
    async generateFromLogo(asset, project) {
        const pipe = asset.pipeline();
        const generated = [];
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        // Generate adaptive icons
        const generatedAdaptiveIcons = await this._generateAdaptiveIconsFromLogo(project, asset, pipe);
        generated.push(...generatedAdaptiveIcons);
        if (asset.kind === "logo" /* Logo */) {
            // Generate legacy icons
            const generatedLegacyIcons = await this.generateLegacyIcon(asset, project);
            generated.push(...generatedLegacyIcons);
            // Generate banners
            const banners = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "banner" /* Banner */);
            const generatedBanners = await Promise.all(banners.map(async (banner) => {
                var _a;
                return this._generateBannersFromLogo(project, asset, banner, pipe, (_a = this.options.splashBackgroundColor) !== null && _a !== void 0 ? _a : '#ffffff');
            }));
            generated.push(...generatedBanners);
            // Generate splashes
            const splashes = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "splash" /* Splash */);
            const generatedSplashes = await Promise.all(splashes.map(async (splash) => {
                var _a;
                return this._generateSplashesFromLogo(project, asset, splash, pipe, (_a = this.options.splashBackgroundColor) !== null && _a !== void 0 ? _a : '#ffffff');
            }));
            generated.push(...generatedSplashes);
        }
        // Generate dark splashes
        const darkSplashes = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "splash-dark" /* SplashDark */);
        const generatedSplashes = await Promise.all(darkSplashes.map(async (splash) => {
            var _a;
            return this._generateSplashesFromLogo(project, asset, splash, pipe, (_a = this.options.splashBackgroundColorDark) !== null && _a !== void 0 ? _a : '#111111');
        }));
        generated.push(...generatedSplashes);
        return [...generated];
    }
    // Generate adaptive icons from the source logo
    async _generateAdaptiveIconsFromLogo(project, asset, pipe) {
        var _a, _b;
        // Current versions of Android don't appear to support night mode icons (13+ might?)
        // so, for now, we only generate light mode ones
        if (asset.kind === "logo-dark" /* LogoDark */) {
            return [];
        }
        // Create the background pipeline for the generated icons
        const backgroundPipe = (0, sharp_1.default)({
            create: {
                width: asset.width,
                height: asset.height,
                channels: 4,
                background: asset.kind === "logo" /* Logo */
                    ? (_a = this.options.iconBackgroundColor) !== null && _a !== void 0 ? _a : '#ffffff'
                    : (_b = this.options.iconBackgroundColorDark) !== null && _b !== void 0 ? _b : '#111111',
            },
        });
        const icons = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "adaptive-icon" /* AdaptiveIcon */);
        const backgroundImages = await Promise.all(icons.map(async (icon) => {
            return await this._generateAdaptiveIconBackground(project, asset, icon, backgroundPipe);
        }));
        const foregroundImages = await Promise.all(icons.map(async (icon) => {
            return await this._generateAdaptiveIconForeground(project, asset, icon, pipe);
        }));
        return [...foregroundImages, ...backgroundImages];
    }
    async _generateBannersFromLogo(project, asset, splash, pipe, backgroundColor) {
        var _a, _b, _c, _d, _e, _f, _g;
        // Generate light splash
        const resPath = this.getResPath(project);
        let drawableDir = `drawable`;
        if (splash.density) {
            drawableDir = `drawable-${splash.density}`;
        }
        const parentDir = (0, path_1.join)(resPath, drawableDir);
        if (!(await (0, utils_fs_1.pathExists)(parentDir))) {
            await (0, utils_fs_1.mkdirp)(parentDir);
        }
        const dest = (0, path_1.join)(resPath, drawableDir, 'banner.png');
        const targetLogoWidthPercent = (_a = this.options.logoSplashScale) !== null && _a !== void 0 ? _a : 0.2;
        let targetWidth = (_b = this.options.logoSplashTargetWidth) !== null && _b !== void 0 ? _b : Math.floor(((_c = splash.width) !== null && _c !== void 0 ? _c : 0) * targetLogoWidthPercent);
        if (targetWidth > splash.width || targetWidth > splash.height) {
            targetWidth = Math.floor(((_d = splash.width) !== null && _d !== void 0 ? _d : 0) * targetLogoWidthPercent);
        }
        if (targetWidth > splash.width || targetWidth > splash.height) {
            (0, log_1.warn)(`Logo dimensions exceed dimensions of splash ${splash.width}x${splash.height}, using default logo size`);
            targetWidth = Math.floor(((_e = splash.width) !== null && _e !== void 0 ? _e : 0) * 0.2);
        }
        const canvas = (0, sharp_1.default)({
            create: {
                width: (_f = splash.width) !== null && _f !== void 0 ? _f : 0,
                height: (_g = splash.height) !== null && _g !== void 0 ? _g : 0,
                channels: 4,
                background: backgroundColor,
            },
        });
        const resized = await (0, sharp_1.default)(asset.path).resize(targetWidth).toBuffer();
        const outputInfo = await canvas
            .composite([{ input: resized, gravity: sharp_1.default.gravity.center }])
            .png()
            .toFile(dest);
        const splashOutput = new output_asset_1.OutputAsset(splash, asset, project, {
            [dest]: dest,
        }, {
            [dest]: outputInfo,
        });
        return splashOutput;
    }
    async _generateSplashesFromLogo(project, asset, splash, pipe, backgroundColor) {
        var _a, _b, _c, _d, _e, _f, _g;
        // Generate light splash
        const resPath = this.getResPath(project);
        let drawableDir = `drawable`;
        if (splash.density) {
            drawableDir = `drawable-${splash.density}`;
        }
        const parentDir = (0, path_1.join)(resPath, drawableDir);
        if (!(await (0, utils_fs_1.pathExists)(parentDir))) {
            await (0, utils_fs_1.mkdirp)(parentDir);
        }
        const dest = (0, path_1.join)(resPath, drawableDir, 'splash.png');
        const targetLogoWidthPercent = (_a = this.options.logoSplashScale) !== null && _a !== void 0 ? _a : 0.2;
        let targetWidth = (_b = this.options.logoSplashTargetWidth) !== null && _b !== void 0 ? _b : Math.floor(((_c = splash.width) !== null && _c !== void 0 ? _c : 0) * targetLogoWidthPercent);
        if (targetWidth > splash.width || targetWidth > splash.height) {
            targetWidth = Math.floor(((_d = splash.width) !== null && _d !== void 0 ? _d : 0) * targetLogoWidthPercent);
        }
        if (targetWidth > splash.width || targetWidth > splash.height) {
            (0, log_1.warn)(`Logo dimensions exceed dimensions of splash ${splash.width}x${splash.height}, using default logo size`);
            targetWidth = Math.floor(((_e = splash.width) !== null && _e !== void 0 ? _e : 0) * 0.2);
        }
        const canvas = (0, sharp_1.default)({
            create: {
                width: (_f = splash.width) !== null && _f !== void 0 ? _f : 0,
                height: (_g = splash.height) !== null && _g !== void 0 ? _g : 0,
                channels: 4,
                background: backgroundColor,
            },
        });
        const resized = await (0, sharp_1.default)(asset.path).resize(targetWidth).toBuffer();
        const outputInfo = await canvas
            .composite([{ input: resized, gravity: sharp_1.default.gravity.center }])
            .png()
            .toFile(dest);
        const splashOutput = new output_asset_1.OutputAsset(splash, asset, project, {
            [dest]: dest,
        }, {
            [dest]: outputInfo,
        });
        return splashOutput;
    }
    async generateLegacyIcon(asset, project) {
        const icons = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "icon" /* Icon */);
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const collected = await Promise.all(icons.map(async (icon) => {
            const [dest, outputInfo] = await this.generateLegacyLauncherIcon(project, asset, icon, pipe);
            return new output_asset_1.OutputAsset(icon, asset, project, { [`mipmap-${icon.density}/ic_launcher.png`]: dest }, { [`mipmap-${icon.density}/ic_launcher.png`]: outputInfo });
        }));
        collected.push(...(await Promise.all(icons.map(async (icon) => {
            const [dest, outputInfo] = await this.generateRoundLauncherIcon(project, asset, icon, pipe);
            return new output_asset_1.OutputAsset(icon, asset, project, { [`mipmap-${icon.density}/ic_launcher_round.png`]: dest }, { [`mipmap-${icon.density}/ic_launcher_round.png`]: outputInfo });
        }))));
        await this.updateManifest(project);
        return collected;
    }
    async generateLegacyLauncherIcon(project, asset, template, pipe) {
        const radius = 4;
        const svg = `<svg width="${template.width}" height="${template.height}"><rect x="0" y="0" width="${template.width}" height="${template.height}" rx="${radius}" fill="#ffffff"/></svg>`;
        const resPath = this.getResPath(project);
        const parentDir = (0, path_1.join)(resPath, `mipmap-${template.density}`);
        if (!(await (0, utils_fs_1.pathExists)(parentDir))) {
            await (0, utils_fs_1.mkdirp)(parentDir);
        }
        const destRound = (0, path_1.join)(resPath, `mipmap-${template.density}`, 'ic_launcher.png');
        // This pipeline is trick, but we need two separate pipelines
        // per https://github.com/lovell/sharp/issues/2378#issuecomment-864132578
        const padding = 8;
        const resized = await (0, sharp_1.default)(asset.path)
            .resize(template.width, template.height)
            // .composite([{ input: Buffer.from(svg), blend: 'dest-in' }])
            .toBuffer();
        const composited = await (0, sharp_1.default)(resized)
            .resize(Math.max(0, template.width - padding * 2), Math.max(0, template.height - padding * 2))
            .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
            .toBuffer();
        const outputInfo = await (0, sharp_1.default)(composited).png().toFile(destRound);
        return [destRound, outputInfo];
    }
    async generateRoundLauncherIcon(project, asset, template, pipe) {
        const svg = `<svg width="${template.width}" height="${template.height}"><circle cx="${template.width / 2}" cy="${template.height / 2}" r="${template.width / 2}" fill="#ffffff"/></svg>`;
        const resPath = this.getResPath(project);
        const destRound = (0, path_1.join)(resPath, `mipmap-${template.density}`, 'ic_launcher_round.png');
        // This pipeline is tricky, but we need two separate pipelines
        // per https://github.com/lovell/sharp/issues/2378#issuecomment-864132578
        const resized = await (0, sharp_1.default)(asset.path).resize(template.width, template.height).toBuffer();
        const composited = await (0, sharp_1.default)(resized)
            .composite([{ input: Buffer.from(svg), blend: 'dest-in' }])
            .toBuffer();
        const outputInfo = await (0, sharp_1.default)(composited).png().toFile(destRound);
        return [destRound, outputInfo];
    }
    async generateAdaptiveIconForeground(asset, project) {
        const icons = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "icon" /* Icon */);
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        return Promise.all(icons.map(async (icon) => {
            return await this._generateAdaptiveIconForeground(project, asset, icon, pipe);
        }));
    }
    async _generateAdaptiveIconForeground(project, asset, icon, pipe) {
        const resPath = this.getResPath(project);
        // Create the foreground and background images
        const destForeground = (0, path_1.join)(resPath, `mipmap-${icon.density}`, 'ic_launcher_foreground.png');
        const parentDir = (0, path_1.dirname)(destForeground);
        if (!(await (0, utils_fs_1.pathExists)(parentDir))) {
            await (0, utils_fs_1.mkdirp)(parentDir);
        }
        const outputInfoForeground = await pipe.resize(icon.width, icon.height).png().toFile(destForeground);
        // Create the adaptive icon XML
        const icLauncherXml = `
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background>
        <inset android:drawable="@mipmap/ic_launcher_background" android:inset="16.7%" />
    </background>
    <foreground>
        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="16.7%" />
    </foreground>
</adaptive-icon>
    `.trim();
        const mipmapAnyPath = (0, path_1.join)(resPath, `mipmap-anydpi-v26`);
        if (!(await (0, utils_fs_1.pathExists)(mipmapAnyPath))) {
            await (0, utils_fs_1.mkdirp)(mipmapAnyPath);
        }
        const destIcLauncher = (0, path_1.join)(mipmapAnyPath, `ic_launcher.xml`);
        const destIcLauncherRound = (0, path_1.join)(mipmapAnyPath, `ic_launcher_round.xml`);
        await (0, utils_fs_1.writeFile)(destIcLauncher, icLauncherXml);
        await (0, utils_fs_1.writeFile)(destIcLauncherRound, icLauncherXml);
        // Return the created files for this OutputAsset
        return new output_asset_1.OutputAsset(icon, asset, project, {
            [`mipmap-${icon.density}/ic_launcher_foreground.png`]: destForeground,
            'mipmap-anydpi-v26/ic_launcher.xml': destIcLauncher,
            'mipmap-anydpi-v26/ic_launcher_round.xml': destIcLauncherRound,
        }, {
            [`mipmap-${icon.density}/ic_launcher_foreground.png`]: outputInfoForeground,
        });
    }
    async generateAdaptiveIconBackground(asset, project) {
        const icons = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "icon" /* Icon */);
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        return Promise.all(icons.map(async (icon) => {
            return await this._generateAdaptiveIconBackground(project, asset, icon, pipe);
        }));
    }
    async _generateAdaptiveIconBackground(project, asset, icon, pipe) {
        const resPath = this.getResPath(project);
        const destBackground = (0, path_1.join)(resPath, `mipmap-${icon.density}`, 'ic_launcher_background.png');
        const parentDir = (0, path_1.dirname)(destBackground);
        if (!(await (0, utils_fs_1.pathExists)(parentDir))) {
            await (0, utils_fs_1.mkdirp)(parentDir);
        }
        const outputInfoBackground = await pipe.resize(icon.width, icon.height).png().toFile(destBackground);
        // Create the adaptive icon XML
        const icLauncherXml = `
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background>
        <inset android:drawable="@mipmap/ic_launcher_background" android:inset="16.7%" />
    </background>
    <foreground>
        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="16.7%" />
    </foreground>
</adaptive-icon>
    `.trim();
        const mipmapAnyPath = (0, path_1.join)(resPath, `mipmap-anydpi-v26`);
        if (!(await (0, utils_fs_1.pathExists)(mipmapAnyPath))) {
            await (0, utils_fs_1.mkdirp)(mipmapAnyPath);
        }
        const destIcLauncher = (0, path_1.join)(mipmapAnyPath, `ic_launcher.xml`);
        const destIcLauncherRound = (0, path_1.join)(mipmapAnyPath, `ic_launcher_round.xml`);
        await (0, utils_fs_1.writeFile)(destIcLauncher, icLauncherXml);
        await (0, utils_fs_1.writeFile)(destIcLauncherRound, icLauncherXml);
        // Return the created files for this OutputAsset
        return new output_asset_1.OutputAsset(icon, asset, project, {
            [`mipmap-${icon.density}/ic_launcher_background.png`]: destBackground,
            'mipmap-anydpi-v26/ic_launcher.xml': destIcLauncher,
            'mipmap-anydpi-v26/ic_launcher_round.xml': destIcLauncherRound,
        }, {
            [`mipmap-${icon.density}/ic_launcher_background.png`]: outputInfoBackground,
        });
    }
    async updateManifest(project) {
        var _a, _b;
        (_b = (_a = project.android) === null || _a === void 0 ? void 0 : _a.getAndroidManifest()) === null || _b === void 0 ? void 0 : _b.setAttrs('manifest/application', {
            'android:icon': '@mipmap/ic_launcher',
            'android:banner': '@drawable/banner',
            'android:roundIcon': '@mipmap/ic_launcher_round',
        });
        await project.commit();
    }
    async generateBanners(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const banners = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "banner" /* Banner */);
        const resPath = this.getResPath(project);
        const collected = await Promise.all(banners.map(async (banner) => {
            const [dest, outputInfo] = await this.generateBanner(project, asset, banner, pipe);
            const relPath = (0, path_1.relative)(resPath, dest);
            return new output_asset_1.OutputAsset(banner, asset, project, { [relPath]: dest }, { [relPath]: outputInfo });
        }));
        return collected;
    }
    async generateBanner(project, asset, template, pipe) {
        const drawableDir = template.density ? `drawable-${template.density}` : 'drawable';
        const resPath = this.getResPath(project);
        const parentDir = (0, path_1.join)(resPath, drawableDir);
        if (!(await (0, utils_fs_1.pathExists)(parentDir))) {
            await (0, utils_fs_1.mkdirp)(parentDir);
        }
        const dest = (0, path_1.join)(resPath, drawableDir, 'banner.png');
        const outputInfo = await pipe.resize(template.width, template.height).png().toFile(dest);
        return [dest, outputInfo];
    }
    async generateSplashes(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const splashes = (asset.kind === "splash" /* Splash */
            ? Object.values(AndroidAssetTemplates).filter((a) => a.kind === "splash" /* Splash */)
            : Object.values(AndroidAssetTemplates).filter((a) => a.kind === "splash-dark" /* SplashDark */));
        const resPath = this.getResPath(project);
        const collected = await Promise.all(splashes.map(async (splash) => {
            const [dest, outputInfo] = await this.generateSplash(project, asset, splash, pipe);
            const relPath = (0, path_1.relative)(resPath, dest);
            return new output_asset_1.OutputAsset(splash, asset, project, { [relPath]: dest }, { [relPath]: outputInfo });
        }));
        return collected;
    }
    async generateSplash(project, asset, template, pipe) {
        const drawableDir = template.density ? `drawable-${template.density}` : 'drawable';
        const resPath = this.getResPath(project);
        const parentDir = (0, path_1.join)(resPath, drawableDir);
        if (!(await (0, utils_fs_1.pathExists)(parentDir))) {
            await (0, utils_fs_1.mkdirp)(parentDir);
        }
        const dest = (0, path_1.join)(resPath, drawableDir, 'splash.png');
        const outputInfo = await pipe.resize(template.width, template.height).png().toFile(dest);
        return [dest, outputInfo];
    }
    getResPath(project) {
        var _a;
        return (0, path_1.join)(project.config.android.path, 'app', 'src', (_a = this.options.androidFlavor) !== null && _a !== void 0 ? _a : 'main', 'res');
    }
}
exports.AndroidAssetGenerator = AndroidAssetGenerator;
