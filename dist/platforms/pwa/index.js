"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PwaAssetGenerator = exports.PWA_ASSET_PATH = void 0;
const tslib_1 = require("tslib");
const utils_fs_1 = require("@ionic/utils-fs");
const node_fetch_1 = (0, tslib_1.__importDefault)(require("node-fetch"));
const node_html_parser_1 = (0, tslib_1.__importDefault)(require("node-html-parser"));
const path_1 = require("path");
const sharp_1 = (0, tslib_1.__importDefault)(require("sharp"));
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
        var _a;
        const path = await this.getManifestJsonPath((_a = project.directory) !== null && _a !== void 0 ? _a : '');
        const contents = await (0, utils_fs_1.readFile)(path, { encoding: 'utf-8' });
        return JSON.parse(contents);
    }
    async getSplashSizes() {
        var _a;
        const appleInterfacePage = `https://developer.apple.com/design/human-interface-guidelines/foundations/layout/`;
        let assetSizes = assets_1.PWA_IOS_DEVICE_SIZES;
        if (!this.options.pwaNoAppleFetch) {
            try {
                const res = await (0, node_fetch_1.default)(appleInterfacePage);
                const html = await res.text();
                const doc = (0, node_html_parser_1.default)(html);
                const target = doc.querySelector('main > section .row > .column table');
                const sizes = (_a = target === null || target === void 0 ? void 0 : target.querySelectorAll('tr > td:nth-child(2)')) !== null && _a !== void 0 ? _a : [];
                const sizeStrings = sizes.map((td) => {
                    const t = td.innerText;
                    return t
                        .slice(t.indexOf('pt (') + 4)
                        .slice(0, -1)
                        .replace(' px ', '');
                });
                const deduped = new Set(sizeStrings);
                assetSizes = Array.from(deduped);
            }
            catch (e) {
                (0, log_1.warn)(`Unable to load iOS HIG screen sizes to generate iOS PWA splash screens. Using local snapshot of device sizes. Use --pwaNoAppleFetch true to always use local sizes`);
            }
        }
        return assetSizes;
    }
    async generate(asset, project) {
        const pwaDir = project.directory;
        if (!pwaDir) {
            throw new error_1.BadProjectError('No web app (PWA) found');
        }
        if (asset.platform !== "any" /* Any */) {
            return [];
        }
        switch (asset.kind) {
            case "logo" /* Logo */:
            case "logo-dark" /* LogoDark */:
                return this.generateFromLogo(asset, project);
            case "icon" /* Icon */:
                return this.generateIcons(asset, project);
            // eslint-disable-next-line no-duplicate-case
            case "icon" /* Icon */:
                return [];
            case "splash" /* Splash */:
            case "splash-dark" /* SplashDark */:
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
        const splashes = await Promise.all(assetSizes.map((a) => this._generateSplashFromLogo(project, asset, a, pipe)));
        generated.push(...splashes.flat());
        return [...logos, ...generated];
    }
    async _generateSplashFromLogo(project, asset, sizeString, pipe) {
        var _a, _b, _c;
        const parts = sizeString.split('@');
        const sizeParts = parts[0].split('x');
        const width = parseFloat(sizeParts[0]);
        const height = parseFloat(sizeParts[1]);
        const density = parts[1];
        const generated = [];
        const pwaDir = await this.getPWADirectory((_a = project.directory) !== null && _a !== void 0 ? _a : undefined);
        const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);
        const destDir = (0, path_1.join)(pwaAssetDir, exports.PWA_ASSET_PATH);
        try {
            await (0, utils_fs_1.mkdirp)(destDir);
        }
        catch {
            // ignore error
        }
        // TODO: In the future, add size checks to ensure canvas image
        // is not exceeded (see Android splash generation)
        const targetLogoWidthPercent = (_b = this.options.logoSplashScale) !== null && _b !== void 0 ? _b : 0.2;
        const targetWidth = (_c = this.options.logoSplashTargetWidth) !== null && _c !== void 0 ? _c : Math.floor(width * targetLogoWidthPercent);
        if (asset.kind === "logo" /* Logo */) {
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
                platform: "pwa" /* Pwa */,
                kind: "splash" /* Splash */,
                format: "png" /* Png */,
                orientation: "portrait" /* Portrait */,
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
            platform: "pwa" /* Pwa */,
            kind: "splash-dark" /* SplashDark */,
            format: "png" /* Png */,
            orientation: "portrait" /* Portrait */,
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
        var _a;
        const pipe = asset.pipeline();
        if (!pipe) {
            throw new error_1.BadPipelineError('Sharp instance not created');
        }
        const pwaDir = await this.getPWADirectory((_a = project.directory) !== null && _a !== void 0 ? _a : undefined);
        const icons = Object.values(assets_1.ASSETS).filter((a) => a.kind === "icon" /* Icon */);
        const generatedAssets = await Promise.all(icons.map(async (icon) => {
            const destDir = (0, path_1.join)(await this.getPWAAssetsDirectory(pwaDir), exports.PWA_ASSET_PATH);
            try {
                await (0, utils_fs_1.mkdirp)(destDir);
            }
            catch {
                // ignore error
            }
            const dest = (0, path_1.join)(destDir, icon.name);
            const outputInfo = await pipe.resize(icon.width, icon.height).png().toFile(dest);
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
        if (await (0, utils_fs_1.pathExists)((0, path_1.join)(projectRoot !== null && projectRoot !== void 0 ? projectRoot : '', 'public')) /* React */) {
            return (0, path_1.join)(projectRoot !== null && projectRoot !== void 0 ? projectRoot : '', 'public');
        }
        else if (await (0, utils_fs_1.pathExists)((0, path_1.join)(projectRoot !== null && projectRoot !== void 0 ? projectRoot : '', 'src/assets')) /* Angular and Vue */) {
            return (0, path_1.join)(projectRoot !== null && projectRoot !== void 0 ? projectRoot : '', 'src/assets');
        }
        else if (await (0, utils_fs_1.pathExists)((0, path_1.join)(projectRoot !== null && projectRoot !== void 0 ? projectRoot : '', 'www'))) {
            return (0, path_1.join)(projectRoot !== null && projectRoot !== void 0 ? projectRoot : '', 'www');
        }
        else {
            return (0, path_1.join)(projectRoot !== null && projectRoot !== void 0 ? projectRoot : '', 'www');
        }
    }
    async getPWAAssetsDirectory(pwaDir) {
        if (await (0, utils_fs_1.pathExists)((0, path_1.join)(pwaDir !== null && pwaDir !== void 0 ? pwaDir : '', 'assets'))) {
            return (0, path_1.join)(pwaDir !== null && pwaDir !== void 0 ? pwaDir : '', 'assets');
        }
        return '';
    }
    async getManifestJsonPath(projectRoot) {
        const r = (p) => (0, path_1.join)(projectRoot !== null && projectRoot !== void 0 ? projectRoot : '', p);
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
        var _a, _b;
        const pwaDir = await this.getPWADirectory((_a = project.directory) !== null && _a !== void 0 ? _a : undefined);
        const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);
        const manifestPath = await this.getManifestJsonPath((_b = project.directory) !== null && _b !== void 0 ? _b : undefined);
        const pwaAssets = assets.filter((a) => a.template.platform === "pwa" /* Pwa */);
        let manifestJson = {};
        if (await (0, utils_fs_1.pathExists)(manifestPath)) {
            manifestJson = await (0, utils_fs_1.readJSON)(manifestPath);
        }
        const icons = manifestJson['icons'] || [];
        for (const asset of pwaAssets) {
            const src = asset.template.name;
            const fname = (0, path_1.basename)(src);
            const relativePath = (0, path_1.relative)(pwaDir, (0, path_1.join)(pwaAssetDir, exports.PWA_ASSET_PATH, fname));
            const existing = !!icons.find((i) => i.src === relativePath);
            if (!existing) {
                icons.push(this.makeIconManifestEntry(asset.template, relativePath));
            }
        }
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
        const ext = (0, path_1.extname)(relativePath);
        const posixPath = relativePath.split(path_1.sep).join(path_1.posix.sep);
        const type = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            svg: 'image/svg+xml',
        }[ext] || 'image/png';
        const entry = {
            src: posixPath,
            type,
            sizes: `${asset.width}x${asset.height}`,
        };
        if (asset.kind === "icon" /* Icon */) {
            entry.purpose = 'any maskable';
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
        var _a, _b;
        const parts = sizeString.split('@');
        const sizeParts = parts[0].split('x');
        const width = parseFloat(sizeParts[0]);
        const height = parseFloat(sizeParts[1]);
        const density = parts[1];
        const name = `apple-splash-${width}-${height}@${density}${asset.kind === "splash-dark" /* SplashDark */ ? '-dark' : ''}.png`;
        const pwaDir = await this.getPWADirectory((_a = project.directory) !== null && _a !== void 0 ? _a : undefined);
        const pwaAssetDir = await this.getPWAAssetsDirectory(pwaDir);
        const destDir = (0, path_1.join)(pwaAssetDir, exports.PWA_ASSET_PATH);
        try {
            await (0, utils_fs_1.mkdirp)(destDir);
        }
        catch {
            // ignore error
        }
        const dest = (0, path_1.join)(destDir, name);
        // console.log(width, height);
        const targetLogoWidthPercent = (_b = this.options.logoSplashScale) !== null && _b !== void 0 ? _b : 0.2;
        const targetWidth = Math.floor(width * targetLogoWidthPercent);
        const outputInfo = await pipe.resize(width, height).png().toFile(dest);
        const template = {
            name,
            platform: "pwa" /* Pwa */,
            kind: "splash" /* Splash */,
            format: "png" /* Png */,
            orientation: "portrait" /* Portrait */,
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
    static logInstructions(generated) {
        var _a, _b, _c, _d, _e, _f;
        (0, log_1.log)(`PWA instructions:

Add the following tags to your index.html to support PWA icons:
`);
        const pwaAssets = generated.filter((g) => g.template.platform === "pwa" /* Pwa */);
        const mainIcon = pwaAssets.find((g) => g.template.width == 512 && g.template.kind === "icon" /* Icon */);
        (0, log_1.log)(`<link rel="apple-touch-icon" href="${Object.values((_a = mainIcon === null || mainIcon === void 0 ? void 0 : mainIcon.destFilenames) !== null && _a !== void 0 ? _a : {})[0]}">`);
        for (const g of pwaAssets.filter((a) => a.template.kind === "icon" /* Icon */)) {
            const w = g.template.width;
            const h = g.template.height;
            const path = (_b = Object.values(g.destFilenames)[0]) !== null && _b !== void 0 ? _b : '';
            (0, log_1.log)(`<link rel="apple-touch-icon" sizes="${w}x${h}" href="${path}">`);
        }
        for (const g of pwaAssets.filter((a) => a.template.kind === "splash" /* Splash */)) {
            const template = g.template;
            const w = g.template.width;
            const h = g.template.height;
            const path = (_c = Object.values(g.destFilenames)[0]) !== null && _c !== void 0 ? _c : '';
            (0, log_1.log)(`<link rel="apple-touch-startup-image" href="${path}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${template.density}) and (orientation: ${"portrait" /* Portrait */})>`);
        }
        for (const g of pwaAssets.filter((a) => a.template.kind === "splash" /* Splash */)) {
            const template = g.template;
            const w = g.template.width;
            const h = g.template.height;
            const path = (_d = Object.values(g.destFilenames)[0]) !== null && _d !== void 0 ? _d : '';
            (0, log_1.log)(`<link rel="apple-touch-startup-image" href="${path}" media="(device-width: ${h}px) and (device-height: ${w}px) and (-webkit-device-pixel-ratio: ${template.density}) and (orientation: ${"landscape" /* Landscape */})>`);
        }
        for (const g of pwaAssets.filter((a) => a.template.kind === "splash-dark" /* SplashDark */)) {
            const template = g.template;
            const w = g.template.width;
            const h = g.template.height;
            const path = (_e = Object.values(g.destFilenames)[0]) !== null && _e !== void 0 ? _e : '';
            (0, log_1.log)(`<link rel="apple-touch-startup-image" href="${path}" media="(prefers-color-scheme: dark) and (device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${template.density}) and (orientation: ${"portrait" /* Portrait */})>`);
        }
        for (const g of pwaAssets.filter((a) => a.template.kind === "splash-dark" /* SplashDark */)) {
            const template = g.template;
            const w = g.template.width;
            const h = g.template.height;
            const path = (_f = Object.values(g.destFilenames)[0]) !== null && _f !== void 0 ? _f : '';
            (0, log_1.log)(`<link rel="apple-touch-startup-image" href="${path}" media="(prefers-color-scheme: dark) and (device-width: ${h}px) and (device-height: ${w}px) and (-webkit-device-pixel-ratio: ${template.density}) and (orientation: ${"landscape" /* Landscape */})>`);
        }
        console.log('Generated', pwaAssets.filter((a) => a.template.kind === "splash" /* Splash */).length, pwaAssets.filter((a) => a.template.kind === "splash-dark" /* SplashDark */).length);
        /*
        for (const g of pwaAssets.filter(a => a.template.kind === AssetKind.Splash)) {
          const w = g.template.width;
          const h = g.template.height;
          const path = Object.values(g.destFilenames)[0] ?? '';
          log(`<link rel="apple-touch-startup-image" href="${path}" media="(device-width: ${w}px) and (device-height: ${h}px) and (orientation: ${g.template>`);
        }
        */
    }
}
exports.PwaAssetGenerator = PwaAssetGenerator;
/*
export async function copyIcons(
  resourcePath: string,
  projectPath: string,
  logstream: NodeJS.WritableStream | null,
  errstream: NodeJS.WritableStream | null,
): Promise<number> {
  const source = join(resourcePath, SOURCE_PWA_ICON);
  const dest = join(projectPath, PWA_ASSET_PATH);

  await Promise.all(copyImages(source, dest, PWA_ICONS, logstream, errstream));

  return PWA_ICONS.length;
}
*/
