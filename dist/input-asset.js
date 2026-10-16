"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputAsset = void 0;
const tslib_1 = require("tslib");
const path_1 = require("path");
const sharp_1 = (0, tslib_1.__importDefault)(require("sharp"));
/**
 * An instance of an asset that we will use to generate
 * a number of output assets.
 */
class InputAsset {
    constructor(path, kind, platform) {
        this.path = path;
        this.kind = kind;
        this.platform = platform;
        this._sharp = null;
        this.filename = (0, path_1.basename)(path);
    }
    pipeline() {
        var _a;
        return (_a = this._sharp) === null || _a === void 0 ? void 0 : _a.clone();
    }
    format() {
        const ext = (0, path_1.extname)(this.filename);
        switch (ext) {
            case '.png':
                return "png" /* Png */;
            case '.jpg':
            case '.jpeg':
                return "jpeg" /* Jpeg */;
            case '.svg':
                return "svg" /* Svg */;
        }
        return "unknown" /* Unknown */;
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
