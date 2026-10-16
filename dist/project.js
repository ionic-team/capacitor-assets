"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const utils_fs_1 = require("@ionic/utils-fs");
const project_1 = require("@trapezedev/project");
const path_1 = require("path");
const input_asset_1 = require("./input-asset");
const log_1 = require("./util/log");
class Project extends project_1.MobileProject {
    constructor(projectRoot = process.cwd(), config, assetPath = 'assets') {
        super(projectRoot, config);
        this.assetPath = assetPath;
        this.assets = null;
        this.directory = null;
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
        var _a, _b;
        return ((_a = this.config.android) === null || _a === void 0 ? void 0 : _a.path) !== undefined && (await (0, utils_fs_1.pathExists)((_b = this.config.android) === null || _b === void 0 ? void 0 : _b.path));
    }
    async iosExists() {
        var _a, _b;
        return ((_a = this.config.ios) === null || _a === void 0 ? void 0 : _a.path) !== undefined && (await (0, utils_fs_1.pathExists)((_b = this.config.ios) === null || _b === void 0 ? void 0 : _b.path));
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
            logoDark: await this.loadInputAsset('logo-dark', "logo-dark" /* LogoDark */, "any" /* Any */),
            icon: await this.loadInputAsset('icon-only', "icon" /* Icon */, "any" /* Any */),
            iconForeground: await this.loadInputAsset('icon-foreground', "icon-foreground" /* IconForeground */, "any" /* Any */),
            iconBackground: await this.loadInputAsset('icon-background', "icon-background" /* IconBackground */, "any" /* Any */),
            splash: await this.loadInputAsset('splash', "splash" /* Splash */, "any" /* Any */),
            splashDark: await this.loadInputAsset('splash-dark', "splash-dark" /* SplashDark */, "any" /* Any */),
            iosIcon: await this.loadInputAsset('ios/icon', "icon" /* Icon */, "ios" /* Ios */),
            iosSplash: await this.loadInputAsset('ios/splash', "splash" /* Splash */, "ios" /* Ios */),
            iosSplashDark: await this.loadInputAsset('ios/splash-dark', "splash-dark" /* SplashDark */, "ios" /* Ios */),
            androidIcon: await this.loadInputAsset('android/icon', "icon" /* Icon */, "android" /* Android */),
            androidIconForeground: await this.loadInputAsset('android/icon-foreground', "icon" /* Icon */, "android" /* Android */),
            androidIconBackground: await this.loadInputAsset('android/icon-background', "icon" /* Icon */, "android" /* Android */),
            androidBanner: await this.loadInputAsset('android/banner', "banner" /* Banner */, "android" /* Android */),
            androidSplash: await this.loadInputAsset('android/splash', "splash" /* Splash */, "android" /* Android */),
            androidSplashDark: await this.loadInputAsset('android/splash-dark', "splash-dark" /* SplashDark */, "android" /* Android */),
            androidNotificationIcon: await this.loadInputAsset('android/notification', "notification-icon" /* NotificationIcon */, "android" /* Android */),
        };
        return this.assets;
    }
    async loadLogoInputAsset() {
        let logo = await this.loadInputAsset('logo', "logo" /* Logo */, "any" /* Any */);
        if (!logo) {
            logo = await this.loadInputAsset('icon', "logo" /* Logo */, "any" /* Any */);
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
