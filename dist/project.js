"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const utils_fs_1 = require("@ionic/utils-fs");
const project_1 = require("@trapezedev/project");
const path_1 = require("path");
const input_asset_1 = require("./input-asset");
const log_1 = require("./util/log");
class Project extends project_1.MobileProject {
    assetPath;
    assets = null;
    directory = null;
    assetDir;
    constructor(projectRoot = process.cwd(), config, assetPath = 'assets') {
        super(projectRoot, config);
        this.assetPath = assetPath;
        this.directory = projectRoot;
        this.assetDir = (0, path_1.join)(projectRoot, assetPath);
        this.detectAssetDir();
    }
    async detectAssetDir() {
        if (this.assetPath === 'assets' && !(await (0, utils_fs_1.pathExists)(this.assetDir))) {
            this.assetDir = (0, path_1.join)(this.projectRoot, 'resources');
        }
    }
    async androidExists() {
        return this.config.android?.path !== undefined && (await (0, utils_fs_1.pathExists)(this.config.android?.path));
    }
    async iosExists() {
        return this.config.ios?.path !== undefined && (await (0, utils_fs_1.pathExists)(this.config.ios?.path));
    }
    async assetDirExists() {
        return (0, utils_fs_1.pathExists)(this.assetDir);
    }
    assetDirectory() {
        return this.assetDir;
    }
    async loadInputAssets() {
        this.assets = {
            logo: await this.loadLogoInputAsset(),
            logoDark: await this.loadInputAsset('logo-dark', "logo-dark" /* AssetKind.LogoDark */, "any" /* Platform.Any */),
            icon: await this.loadInputAsset('icon-only', "icon" /* AssetKind.Icon */, "any" /* Platform.Any */),
            iconForeground: await this.loadInputAsset('icon-foreground', "icon-foreground" /* AssetKind.IconForeground */, "any" /* Platform.Any */),
            iconBackground: await this.loadInputAsset('icon-background', "icon-background" /* AssetKind.IconBackground */, "any" /* Platform.Any */),
            splash: await this.loadInputAsset('splash', "splash" /* AssetKind.Splash */, "any" /* Platform.Any */),
            splashDark: await this.loadInputAsset('splash-dark', "splash-dark" /* AssetKind.SplashDark */, "any" /* Platform.Any */),
            iosIcon: await this.loadInputAsset('ios/icon', "icon" /* AssetKind.Icon */, "ios" /* Platform.Ios */),
            iosIconDark: await this.loadInputAsset('ios/icon-dark', "icon-dark" /* AssetKind.IconDark */, "ios" /* Platform.Ios */),
            iosIconTinted: await this.loadInputAsset('ios/icon-tinted', "icon-tinted" /* AssetKind.IconTinted */, "ios" /* Platform.Ios */),
            iosSplash: await this.loadInputAsset('ios/splash', "splash" /* AssetKind.Splash */, "ios" /* Platform.Ios */),
            iosSplashDark: await this.loadInputAsset('ios/splash-dark', "splash-dark" /* AssetKind.SplashDark */, "ios" /* Platform.Ios */),
            androidIcon: await this.loadInputAsset('android/icon', "icon" /* AssetKind.Icon */, "android" /* Platform.Android */),
            androidIconForeground: await this.loadInputAsset('android/icon-foreground', "icon-foreground" /* AssetKind.IconForeground */, "android" /* Platform.Android */),
            androidIconBackground: await this.loadInputAsset('android/icon-background', "icon-background" /* AssetKind.IconBackground */, "android" /* Platform.Android */),
            androidSplash: await this.loadInputAsset('android/splash', "splash" /* AssetKind.Splash */, "android" /* Platform.Android */),
            androidSplashDark: await this.loadInputAsset('android/splash-dark', "splash-dark" /* AssetKind.SplashDark */, "android" /* Platform.Android */),
            androidNotificationIcon: await this.loadInputAsset('android/notification', "notification-icon" /* AssetKind.NotificationIcon */, "android" /* Platform.Android */),
            pwaIcon: await this.loadInputAsset('pwa/icon', "icon" /* AssetKind.Icon */, "pwa" /* Platform.Pwa */),
            pwaSplash: await this.loadInputAsset('pwa/splash', "splash" /* AssetKind.Splash */, "pwa" /* Platform.Pwa */),
            pwaSplashDark: await this.loadInputAsset('pwa/splash-dark', "splash-dark" /* AssetKind.SplashDark */, "pwa" /* Platform.Pwa */),
        };
        return this.assets;
    }
    async loadLogoInputAsset() {
        let logo = await this.loadInputAsset('logo', "logo" /* AssetKind.Logo */, "any" /* Platform.Any */);
        if (!logo) {
            logo = await this.loadInputAsset('icon', "logo" /* AssetKind.Logo */, "any" /* Platform.Any */);
        }
        return logo;
    }
    async loadInputAsset(path, kind, platform) {
        let imagePath = null;
        const extensions = ['.png', '.webp', '.jpg', '.jpeg', '.svg'];
        let filename = null;
        for (const ext of extensions) {
            filename = `${path}${ext}`;
            if (await (0, utils_fs_1.pathExists)((0, path_1.join)(this.assetDir, filename))) {
                imagePath = (0, path_1.join)(this.assetDir, filename);
                break;
            }
        }
        if (!imagePath) {
            return null;
        }
        const asset = new input_asset_1.InputAsset(imagePath, kind, platform);
        try {
            await asset.load();
            return asset;
        }
        catch (e) {
            (0, log_1.error)(`Unable to load source image ${filename}: ${e.message}`);
            return null;
        }
    }
}
exports.Project = Project;
