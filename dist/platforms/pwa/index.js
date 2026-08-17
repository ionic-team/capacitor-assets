"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PwaAssetGenerator = exports.PWA_ASSET_PATH = void 0;
const tslib_1 = require("tslib");
const utils_fs_1 = require("@ionic/utils-fs");
const path_1 = require("path");
const sharp_1 = tslib_1.__importDefault(require("sharp"));
const asset_generator_1 = require("../../asset-generator");
const error_1 = require("../../error");
const output_asset_1 = require("../../output-asset");
const log_1 = require("../../util/log");
const assets_1 = require("./assets");
exports.PWA_ASSET_PATH = 'icons';
class PwaAssetGenerator extends asset_generator_1.AssetGenerator {
    constructor(options = {}) {
        super(options);
    }
    async getManifestJson(project) {
        const path = await this.getManifestJsonPath(project.directory ?? '');
        const contents = await (0, utils_fs_1.readFile)(path, { encoding: 'utf-8' });
        return JSON.parse(contents);
    }
    async getSplashSizes() {
        // Historically this scraped Apple's HIG layout page for device sizes,
        // but the page's markup changed and the scrape silently returned an
        // empty list. The maintained static list is now the single source.
        return assets_1.PWA_IOS_DEVICE_SIZES;
    }
    async generate(asset, project) {
        const pwaDir = project.directory;
        if (!pwaDir) {
            throw new error_1.BadProjectError('No web app (PWA) found');
        }
        if (asset.platform !== "any" /* Platform.Any */ && asset.platform !== "pwa" /* Platform.Pwa */) {
            return [];
        }
        switch (asset.kind) {
            case "logo" /* AssetKind.Logo */:
            case "logo-dark" /* AssetKind.LogoDark */:
                return this.generateFromLogo(asset, project);
            case "icon" /* AssetKind.Icon */:
                return this.generateIcons(asset, project);
            case "splash" /* AssetKind.Splash */:
            case "splash-dark" /* AssetKind.SplashDark */:
                // PWA has no splashes
                return this.generateSplashes(asset, project);
        }
        return [];
    }
    async generateFromLogo(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        // Generate logos
        const logos = await this.generateIcons(asset, project);
        const assetSizes = await this.getSplashSizes();
        const generated = [];
        const splashes = await Promise.all(assetSizes.map((a) => this._generateSplashFromLogo(project, asset, a)));
        generated.push(...splashes.flat());
        return [...logos, ...generated];
    }
    async _generateSplashFromLogo(project, asset, sizeString) {
        const parts = sizeString.split('@');
        const sizeParts = parts[0].split('x');
        const width = parseFloat(sizeParts[0]);
        const height = parseFloat(sizeParts[1]);
        const density = parts[1];
        const generated = [];
        const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
        const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);
        const destDir = (0, path_1.join)(pwaAssetDir, exports.PWA_ASSET_PATH);
        try {
            await (0, utils_fs_1.mkdirp)(destDir);
        }
        catch (e) {
            console.log(e);
            // ignore error
        }
        // TODO: In the future, add size checks to ensure canvas image
        // is not exceeded (see Android splash generation)
        const targetLogoWidthPercent = this.options.logoSplashScale ?? 0.2;
        const targetWidth = this.options.logoSplashTargetWidth ?? Math.floor(width * targetLogoWidthPercent);
        if (asset.kind === "logo" /* AssetKind.Logo */) {
            // Generate light splash
            const lightDefaultBackground = '#ffffff';
            const lightDest = (0, path_1.join)(destDir, `apple-splash-${width}-${height}@${density}.png`);
            const canvas = (0, sharp_1.default)({
                create: {
                    width,
                    height,
                    channels: 4,
                    background: lightDefaultBackground,
                },
            });
            const resized = await (0, sharp_1.default)(asset.path).resize(targetWidth).toBuffer();
            const lightOutputInfo = await canvas
                .composite([{ input: resized, gravity: sharp_1.default.gravity.center }])
                .png()
                .toFile(lightDest);
            const template = {
                name: `apple-splash-${width}-${height}@${density}.png`,
                platform: "pwa" /* Platform.Pwa */,
                kind: "splash" /* AssetKind.Splash */,
                format: "png" /* Format.Png */,
                orientation: "portrait" /* Orientation.Portrait */,
                density: density[0],
                width,
                height,
            };
            const lightSplashOutput = new output_asset_1.OutputAsset(template, asset, project, {
                [lightDest]: lightDest,
            }, {
                [lightDest]: lightOutputInfo,
            });
            generated.push(lightSplashOutput);
        }
        // Generate dark splash
        const darkDefaultBackground = '#111111';
        const darkDest = (0, path_1.join)(destDir, `apple-splash-${width}-${height}@${density}-dark.png`);
        const canvas = (0, sharp_1.default)({
            create: {
                width,
                height,
                channels: 4,
                background: darkDefaultBackground,
            },
        });
        const resized = await (0, sharp_1.default)(asset.path).resize(targetWidth).toBuffer();
        const darkOutputInfo = await canvas
            .composite([{ input: resized, gravity: sharp_1.default.gravity.center }])
            .png()
            .toFile(darkDest);
        const template = {
            name: `apple-splash-${width}-${height}@${density}-dark.png`,
            platform: "pwa" /* Platform.Pwa */,
            kind: "splash-dark" /* AssetKind.SplashDark */,
            format: "png" /* Format.Png */,
            orientation: "portrait" /* Orientation.Portrait */,
            density: density[0],
            width,
            height,
        };
        const darkSplashOutput = new output_asset_1.OutputAsset(template, asset, project, {
            [darkDest]: darkDest,
        }, {
            [darkDest]: darkOutputInfo,
        });
        generated.push(darkSplashOutput);
        return generated;
    }
    async generateIcons(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
        const icons = Object.values(assets_1.ASSETS).filter((a) => a.kind === "icon" /* AssetKind.Icon */);
        const generatedAssets = await Promise.all(icons.map(async (icon) => {
            const destDir = (0, path_1.join)(await this.getPWAAssetsDirectory(pwaDir), exports.PWA_ASSET_PATH);
            try {
                await (0, utils_fs_1.mkdirp)(destDir);
            }
            catch {
                // ignore error
            }
            const dest = (0, path_1.join)(destDir, icon.name);
            let outputInfo;
            if (icon.purpose === 'maskable' || icon.excludeFromManifest) {
                // Maskable and apple-touch icons need an opaque background with
                // the art confined to the central safe zone: only a circle of
                // radius 40% is guaranteed to survive masking, and iOS applies
                // its own rounded mask to apple-touch icons.
                const safeZoneScale = 0.8;
                const scaled = await (0, sharp_1.default)(asset.path)
                    .resize(Math.round(icon.width * safeZoneScale), Math.round(icon.height * safeZoneScale), {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 },
                })
                    .toBuffer();
                outputInfo = await (0, sharp_1.default)({
                    create: {
                        width: icon.width,
                        height: icon.height,
                        channels: 4,
                        background: this.options.iconBackgroundColor ?? '#ffffff',
                    },
                })
                    .composite([{ input: scaled, gravity: sharp_1.default.gravity.center }])
                    .png()
                    .toFile(dest);
            }
            else {
                outputInfo = await (0, sharp_1.default)(asset.path).resize(icon.width, icon.height).png().toFile(dest);
            }
            return new output_asset_1.OutputAsset(icon, asset, project, {
                [icon.name]: dest,
            }, {
                [icon.name]: outputInfo,
            });
        }));
        await this.updateManifest(project, generatedAssets);
        return generatedAssets;
    }
    async getPWADirectory(projectRoot) {
        if (await (0, utils_fs_1.pathExists)((0, path_1.join)(projectRoot ?? '', 'public')) /* React */) {
            return (0, path_1.join)(projectRoot ?? '', 'public');
        }
        else if (await (0, utils_fs_1.pathExists)((0, path_1.join)(projectRoot ?? '', 'src')) /* Angular and Vue */) {
            return (0, path_1.join)(projectRoot ?? '', 'src');
        }
        else if (await (0, utils_fs_1.pathExists)((0, path_1.join)(projectRoot ?? '', 'www'))) {
            return (0, path_1.join)(projectRoot ?? '', 'www');
        }
        else {
            return (0, path_1.join)(projectRoot ?? '', 'www');
        }
    }
    async getPWAAssetsDirectory(pwaDir) {
        if (await (0, utils_fs_1.pathExists)((0, path_1.join)(pwaDir ?? '', 'assets'))) {
            return (0, path_1.join)(pwaDir ?? '', 'assets');
        }
        return '';
    }
    async getManifestJsonPath(projectRoot) {
        const r = (p) => (0, path_1.join)(projectRoot ?? '', p);
        if (this.options.pwaManifestPath) {
            return r(this.options.pwaManifestPath);
        }
        if (await (0, utils_fs_1.pathExists)(r('public'))) {
            if (await (0, utils_fs_1.pathExists)(r('public/manifest.json'))) {
                return r('public/manifest.json');
            }
            // Default to the spec-preferred naming
            return r('public/manifest.webmanifest');
        }
        else if (await (0, utils_fs_1.pathExists)(r('src/assets'))) {
            if (await (0, utils_fs_1.pathExists)(r('src/manifest.json'))) {
                return r('src/manifest.json');
            }
            // Default to the spec-preferred naming
            return r('src/manifest.webmanifest');
        }
        else if (await (0, utils_fs_1.pathExists)(r('www'))) {
            if (await (0, utils_fs_1.pathExists)(r('www'))) {
                return r('www/manifest.json');
            }
            // Default to the spec-preferred naming
            return r('www/manifest.webmanifest');
        }
        else {
            // Safe fallback to older styles
            return r('www/manifest.json');
        }
    }
    async updateManifest(project, assets) {
        const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
        const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);
        const manifestPath = await this.getManifestJsonPath(project.directory ?? undefined);
        const pwaAssets = assets.filter((a) => a.template.platform === "pwa" /* Platform.Pwa */ && !a.template.excludeFromManifest);
        let manifestJson = {};
        if (await (0, utils_fs_1.pathExists)(manifestPath)) {
            manifestJson = await (0, utils_fs_1.readJSON)(manifestPath);
        }
        let icons = manifestJson['icons'] || [];
        const replacedIcons = [];
        for (const asset of pwaAssets) {
            const src = asset.template.name;
            const fname = (0, path_1.basename)(src);
            const relativePath = (0, path_1.relative)(pwaDir, (0, path_1.join)(pwaAssetDir, exports.PWA_ASSET_PATH, fname));
            replacedIcons.push(this.makeIconManifestEntry(asset.template, relativePath));
        }
        // Delete previously generated icon files that are no longer part of
        // the generated set (e.g. legacy sizes from an older version). Only
        // files inside this tool's own output directory are ever deleted —
        // manifest entries pointing elsewhere are user-managed files.
        const outputDir = (0, path_1.join)(pwaAssetDir, exports.PWA_ASSET_PATH);
        const newSrcs = new Set(replacedIcons.map((i) => i.src));
        for (const icon of icons) {
            const iconPath = (0, path_1.join)(pwaDir, icon.src);
            const isOurs = !(0, path_1.relative)(outputDir, iconPath).startsWith('..');
            if (isOurs && !newSrcs.has(icon.src) && (await (0, utils_fs_1.pathExists)(iconPath))) {
                (0, utils_fs_1.rmSync)(iconPath);
                (0, log_1.warn)(`DELETE ${icon.src}`);
            }
        }
        icons = replacedIcons;
        // Update the manifest background color to the splash one if provided to ensure
        // platform automatic splash generation works
        if (this.options.splashBackgroundColor) {
            manifestJson['background_color'] = this.options.splashBackgroundColor;
        }
        const jsonOutput = {
            ...manifestJson,
            icons,
        };
        await (0, utils_fs_1.writeJSON)(manifestPath, jsonOutput, {
            spaces: 2,
        });
    }
    makeIconManifestEntry(asset, relativePath) {
        const ext = (0, path_1.extname)(relativePath).replace('.', '');
        const posixPath = relativePath.split(path_1.sep).join(path_1.posix.sep);
        const type = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            svg: 'image/svg+xml',
            webp: 'image/webp',
        }[ext] || 'image/png';
        const entry = {
            src: posixPath,
            type,
            sizes: `${asset.width}x${asset.height}`,
        };
        if (asset.kind === "icon" /* AssetKind.Icon */) {
            entry.purpose = asset.purpose ?? 'any';
        }
        return entry;
    }
    async generateSplashes(asset, project) {
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const assetSizes = await this.getSplashSizes();
        return Promise.all(assetSizes.map((a) => this._generateSplash(project, asset, a, pipe)));
    }
    async _generateSplash(project, asset, sizeString, pipe) {
        const parts = sizeString.split('@');
        const sizeParts = parts[0].split('x');
        const width = parseFloat(sizeParts[0]);
        const height = parseFloat(sizeParts[1]);
        const density = parts[1];
        const name = `apple-splash-${width}-${height}@${density}${asset.kind === "splash-dark" /* AssetKind.SplashDark */ ? '-dark' : ''}.png`;
        const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
        const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);
        const destDir = (0, path_1.join)(pwaAssetDir, exports.PWA_ASSET_PATH);
        try {
            await (0, utils_fs_1.mkdirp)(destDir);
        }
        catch {
            // ignore error
        }
        const dest = (0, path_1.join)(destDir, name);
        const outputInfo = await pipe.resize(width, height).png().toFile(dest);
        const template = {
            name,
            platform: "pwa" /* Platform.Pwa */,
            kind: "splash" /* AssetKind.Splash */,
            format: "png" /* Format.Png */,
            orientation: "portrait" /* Orientation.Portrait */,
            density: density[0],
            width,
            height,
        };
        const splashOutput = new output_asset_1.OutputAsset(template, asset, project, {
            [dest]: dest,
        }, {
            [dest]: outputInfo,
        });
        return splashOutput;
    }
    async logInstructions(project, generated) {
        const pwaDir = await this.getPWADirectory(project.directory ?? undefined);
        const webPath = (g) => {
            const dest = Object.values(g.destFilenames)[0] ?? '';
            return '/' + (0, path_1.relative)(pwaDir, dest).split(path_1.sep).join(path_1.posix.sep);
        };
        const pwaAssets = generated.filter((g) => g.template.platform === "pwa" /* Platform.Pwa */);
        (0, log_1.log)(`PWA instructions:

Add the following tags to your index.html to support PWA icons and iOS splash screens:
`);
        const touchIcon = pwaAssets.find((g) => g.template.name === 'apple-touch-icon.png');
        if (touchIcon) {
            (0, log_1.log)(`<link rel="apple-touch-icon" href="${webPath(touchIcon)}">`);
        }
        // apple-touch-startup-image media queries use CSS points (px / scale)
        const splashLink = (g, dark, landscape) => {
            const template = g.template;
            const scale = parseInt(template.density ?? '2', 10);
            const wPts = template.width / scale;
            const hPts = template.height / scale;
            const deviceW = landscape ? hPts : wPts;
            const deviceH = landscape ? wPts : hPts;
            const media = [
                ...(dark ? ['(prefers-color-scheme: dark)'] : []),
                `(device-width: ${deviceW}px)`,
                `(device-height: ${deviceH}px)`,
                `(-webkit-device-pixel-ratio: ${scale})`,
                `(orientation: ${landscape ? "landscape" /* Orientation.Landscape */ : "portrait" /* Orientation.Portrait */})`,
            ].join(' and ');
            return `<link rel="apple-touch-startup-image" href="${webPath(g)}" media="${media}">`;
        };
        for (const g of pwaAssets.filter((a) => a.template.kind === "splash" /* AssetKind.Splash */)) {
            (0, log_1.log)(splashLink(g, false, false));
            (0, log_1.log)(splashLink(g, false, true));
        }
        for (const g of pwaAssets.filter((a) => a.template.kind === "splash-dark" /* AssetKind.SplashDark */)) {
            (0, log_1.log)(splashLink(g, true, false));
            (0, log_1.log)(splashLink(g, true, true));
        }
    }
}
exports.PwaAssetGenerator = PwaAssetGenerator;
