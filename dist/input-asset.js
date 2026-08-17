"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputAsset = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const sharp_1 = tslib_1.__importDefault(require("sharp"));
/**
 * An instance of an asset that we will use to generate
 * a number of output assets.
 */
class InputAsset {
    path;
    kind;
    platform;
    filename;
    width;
    height;
    _sharp = null;
    constructor(path, kind, platform) {
        this.path = path;
        this.kind = kind;
        this.platform = platform;
        this.filename = (0, path_1.basename)(path);
    }
    pipeline() {
        return this._sharp?.clone();
    }
    format() {
        const ext = (0, path_1.extname)(this.filename);
        switch (ext) {
            case '.png':
                return "png" /* Format.Png */;
            case '.jpg':
            case '.jpeg':
                return "jpeg" /* Format.Jpeg */;
            case '.svg':
                return "svg" /* Format.Svg */;
        }
        return "unknown" /* Format.Unknown */;
    }
    async load() {
        this._sharp = await (0, sharp_1.default)(this.path);
        const metadata = await this._sharp.metadata();
        this.width = metadata.width;
        this.height = metadata.height;
    }
    async generate(strategy, project) {
        return strategy.generate(this, project);
    }
}
exports.InputAsset = InputAsset;
