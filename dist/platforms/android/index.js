"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidAssetGenerator = void 0;
const tslib_1 = require("tslib");
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const utils_fs_1 = require("@ionic/utils-fs");
const path_1 = require("path");
const sharp_1 = tslib_1.__importDefault(require("sharp"));
const asset_generator_1 = require("../../asset-generator");
const error_1 = require("../../error");
const output_asset_1 = require("../../output-asset");
const log_1 = require("../../util/log");
const AndroidAssetTemplates = tslib_1.__importStar(require("./assets"));
/**
 * Adaptive icon layer XML (mipmap-anydpi-v26/ic_launcher.xml).
 *
 * - The background layer must be full-bleed (108dp, opaque) — masks and
 *   parallax may expose any part of it, so it is never inset.
 * - The foreground is inset so the logo stays inside the 66dp safe zone
 *   of the 108dp canvas ((108 - 66) / 2 / 108 ≈ 19.4%).
 * - The monochrome layer enables Android 13+ themed icons; the system uses
 *   the alpha channel of the drawable, so the foreground works as a source.
 *   Without it, Android 16 QPR2+ force-themes icons with an auto-derived
 *   (and often artifact-prone) monochrome version.
 */
const IC_LAUNCHER_XML = `
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground>
        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="19.4%" />
    </foreground>
    <monochrome>
        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="19.4%" />
    </monochrome>
</adaptive-icon>
`.trim();
class AndroidAssetGenerator extends asset_generator_1.AssetGenerator {
    constructor(options = {}) {
        super(options);
    }
    async generate(asset, project) {
        const androidDir = project.config.android?.path;
        if (!androidDir) {
            throw new error_1.BadProjectError('No android project found');
        }
        if (asset.platform !== "any" /* Platform.Any */ && asset.platform !== "android" /* Platform.Android */) {
            return [];
        }
        switch (asset.kind) {
            case "logo" /* AssetKind.Logo */:
            case "logo-dark" /* AssetKind.LogoDark */:
                return this.generateFromLogo(asset, project);
            case "icon" /* AssetKind.Icon */:
                return this.generateLegacyIcon(asset, project);
            case "icon-foreground" /* AssetKind.IconForeground */:
                return this.generateAdaptiveIconForeground(asset, project);
            case "icon-background" /* AssetKind.IconBackground */:
                return this.generateAdaptiveIconBackground(asset, project);
            case "notification-icon" /* AssetKind.NotificationIcon */:
                return this.generateNotificationIcons(asset, project);
            case "splash" /* AssetKind.Splash */:
            case "splash-dark" /* AssetKind.SplashDark */:
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
        if (asset.kind === "logo" /* AssetKind.Logo */) {
            // Generate legacy icons
            const generatedLegacyIcons = await this.generateLegacyIcon(asset, project);
            generated.push(...generatedLegacyIcons);
            const splashes = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "splash" /* AssetKind.Splash */);
            const generatedSplashes = await Promise.all(splashes.map(async (splash) => {
                return this._generateSplashesFromLogo(project, asset, splash, pipe, this.options.splashBackgroundColor ?? '#ffffff');
            }));
            generated.push(...generatedSplashes);
        }
        // Generate dark splashes
        const darkSplashes = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "splash-dark" /* AssetKind.SplashDark */);
        const generatedSplashes = await Promise.all(darkSplashes.map(async (splash) => {
            return this._generateSplashesFromLogo(project, asset, splash, pipe, this.options.splashBackgroundColorDark ?? '#111111');
        }));
        generated.push(...generatedSplashes);
        return [...generated];
    }
    // Generate adaptive icons from the source logo
    async _generateAdaptiveIconsFromLogo(project, asset, pipe) {
        const isNightMode = asset.kind !== "logo" /* AssetKind.Logo */;
        // Create the background pipeline for the generated icons
        const backgroundPipe = (0, sharp_1.default)({
            create: {
                width: asset.width,
                height: asset.height,
                channels: 4,
                background: isNightMode
                    ? (this.options.iconBackgroundColorDark ?? '#111111')
                    : (this.options.iconBackgroundColor ?? '#ffffff'),
            },
        });
        const adaptiveIconKind = isNightMode ? "adaptive-icon-dark" /* AssetKind.AdaptiveIconDark */ : "adaptive-icon" /* AssetKind.AdaptiveIcon */;
        const icons = Object.values(AndroidAssetTemplates).filter((a) => a.kind === adaptiveIconKind);
        const backgroundImages = await Promise.all(icons.map(async (icon) => {
            return await this._generateAdaptiveIconBackground(project, asset, icon, backgroundPipe);
        }));
        const foregroundImages = await Promise.all(icons.map(async (icon) => {
            return await this._generateAdaptiveIconForeground(project, asset, icon, pipe);
        }));
        return [...foregroundImages, ...backgroundImages];
    }
    async _generateSplashesFromLogo(project, asset, splash, pipe, backgroundColor) {
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
        const targetLogoWidthPercent = this.options.logoSplashScale ?? 0.2;
        let targetWidth = this.options.logoSplashTargetWidth ?? Math.floor((splash.width ?? 0) * targetLogoWidthPercent);
        if (targetWidth > splash.width || targetWidth > splash.height) {
            targetWidth = Math.floor((splash.width ?? 0) * targetLogoWidthPercent);
        }
        if (targetWidth > splash.width || targetWidth > splash.height) {
            (0, log_1.warn)(`Logo dimensions exceed dimensions of splash ${splash.width}x${splash.height}, using default logo size`);
            targetWidth = Math.floor((splash.width ?? 0) * 0.2);
        }
        const canvas = (0, sharp_1.default)({
            create: {
                width: splash.width ?? 0,
                height: splash.height ?? 0,
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
        const icons = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "icon" /* AssetKind.Icon */);
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const collected = await Promise.all(icons.map(async (icon) => {
            const [dest, outputInfo] = await this.generateLegacyLauncherIcon(project, asset, icon);
            return new output_asset_1.OutputAsset(icon, asset, project, { [`mipmap-${icon.density}/ic_launcher.png`]: dest }, { [`mipmap-${icon.density}/ic_launcher.png`]: outputInfo });
        }));
        collected.push(...(await Promise.all(icons.map(async (icon) => {
            const [dest, outputInfo] = await this.generateRoundLauncherIcon(project, asset, icon);
            return new output_asset_1.OutputAsset(icon, asset, project, { [`mipmap-${icon.density}/ic_launcher_round.png`]: dest }, { [`mipmap-${icon.density}/ic_launcher_round.png`]: outputInfo });
        }))));
        await this.updateManifest(project);
        return collected;
    }
    async generateLegacyLauncherIcon(project, asset, template) {
        const resPath = this.getResPath(project);
        const parentDir = (0, path_1.join)(resPath, `mipmap-${template.density}`);
        if (!(await (0, utils_fs_1.pathExists)(parentDir))) {
            await (0, utils_fs_1.mkdirp)(parentDir);
        }
        const destRound = (0, path_1.join)(resPath, `mipmap-${template.density}`, 'ic_launcher.png');
        // This pipeline is trick, but we need two separate pipelines
        // per https://github.com/lovell/sharp/issues/2378#issuecomment-864132578
        // Padding scales with density so the logo renders at the same
        // relative size at every dpi (8px at the 96px xhdpi baseline).
        const padding = Math.round(template.width / 12);
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
    async generateRoundLauncherIcon(project, asset, template) {
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
        const icons = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "adaptive-icon" /* AssetKind.AdaptiveIcon */);
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
        const mipmapAnyPath = (0, path_1.join)(resPath, `mipmap-anydpi-v26`);
        if (!(await (0, utils_fs_1.pathExists)(mipmapAnyPath))) {
            await (0, utils_fs_1.mkdirp)(mipmapAnyPath);
        }
        const destIcLauncher = (0, path_1.join)(mipmapAnyPath, `ic_launcher.xml`);
        const destIcLauncherRound = (0, path_1.join)(mipmapAnyPath, `ic_launcher_round.xml`);
        await (0, utils_fs_1.writeFile)(destIcLauncher, IC_LAUNCHER_XML);
        await (0, utils_fs_1.writeFile)(destIcLauncherRound, IC_LAUNCHER_XML);
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
        const icons = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "adaptive-icon" /* AssetKind.AdaptiveIcon */);
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
        const mipmapAnyPath = (0, path_1.join)(resPath, `mipmap-anydpi-v26`);
        if (!(await (0, utils_fs_1.pathExists)(mipmapAnyPath))) {
            await (0, utils_fs_1.mkdirp)(mipmapAnyPath);
        }
        const destIcLauncher = (0, path_1.join)(mipmapAnyPath, `ic_launcher.xml`);
        const destIcLauncherRound = (0, path_1.join)(mipmapAnyPath, `ic_launcher_round.xml`);
        await (0, utils_fs_1.writeFile)(destIcLauncher, IC_LAUNCHER_XML);
        await (0, utils_fs_1.writeFile)(destIcLauncherRound, IC_LAUNCHER_XML);
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
        project.android?.getAndroidManifest()?.setAttrs('manifest/application', {
            'android:icon': '@mipmap/ic_launcher',
            'android:roundIcon': '@mipmap/ic_launcher_round',
        });
        await project.commit();
    }
    async generateSplashes(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const splashes = (asset.kind === "splash" /* AssetKind.Splash */
            ? Object.values(AndroidAssetTemplates).filter((a) => a.kind === "splash" /* AssetKind.Splash */)
            : Object.values(AndroidAssetTemplates).filter((a) => a.kind === "splash-dark" /* AssetKind.SplashDark */));
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
        return (0, path_1.join)(project.config.android.path, 'app', 'src', this.options.androidFlavor ?? 'main', 'res');
    }
    async generateNotificationIcons(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const notificationTemplates = Object.values(AndroidAssetTemplates).filter((a) => a.kind === "notification-icon" /* AssetKind.NotificationIcon */);
        const resPath = this.getResPath(project);
        const generated = [];
        for (const template of notificationTemplates) {
            try {
                const drawablePath = (0, path_1.join)(resPath, `drawable-${template.density}`);
                if (!(await (0, utils_fs_1.pathExists)(drawablePath))) {
                    await (0, utils_fs_1.mkdirp)(drawablePath);
                }
                const destFile = (0, path_1.join)(drawablePath, 'ic_stat_notification.png');
                const outputInfo = await pipe.resize(template.width, template.height).png().toFile(destFile);
                const relPath = (0, path_1.relative)(resPath, destFile);
                generated.push(new output_asset_1.OutputAsset(template, asset, project, { [relPath]: destFile }, { [relPath]: outputInfo }));
            }
            catch (err) {
                (0, log_1.error)(`Failed to generate ${template.density} notification icon:`, err);
            }
        }
        // Generate for main drawable folder
        try {
            const mainDrawablePath = (0, path_1.join)(resPath, 'drawable');
            if (!(await (0, utils_fs_1.pathExists)(mainDrawablePath))) {
                await (0, utils_fs_1.mkdirp)(mainDrawablePath);
            }
            const mainDestFile = (0, path_1.join)(mainDrawablePath, 'ic_stat_notification.png');
            const outputInfo = await pipe
                .resize(AndroidAssetTemplates.ANDROID_NOTIFICATION_XXXHDPI_ICON.width, AndroidAssetTemplates.ANDROID_NOTIFICATION_XXXHDPI_ICON.height)
                .png()
                .toFile(mainDestFile);
            const relPath = (0, path_1.relative)(resPath, mainDestFile);
            generated.push(new output_asset_1.OutputAsset({
                platform: "android" /* Platform.Android */,
                kind: "notification-icon" /* AssetKind.NotificationIcon */,
                format: "png" /* Format.Png */,
                width: AndroidAssetTemplates.ANDROID_NOTIFICATION_XXXHDPI_ICON.width,
                height: AndroidAssetTemplates.ANDROID_NOTIFICATION_XXXHDPI_ICON.height,
            }, asset, project, { [relPath]: mainDestFile }, { [relPath]: outputInfo }));
        }
        catch (err) {
            (0, log_1.error)('Failed to generate main notification icon:', err);
        }
        return generated;
    }
}
exports.AndroidAssetGenerator = AndroidAssetGenerator;
