"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputAsset = void 0;
/**
 * An instance of a generated asset
 */
class OutputAsset {
    constructor(template, asset, project, destFilenames, outputInfoMap) {
        this.template = template;
        this.asset = asset;
        this.project = project;
        this.destFilenames = destFilenames;
        this.outputInfoMap = outputInfoMap;
    }
    getDestFilename(assetName) {
        return this.destFilenames[assetName];
    }
    getOutputInfo(assetName) {
        return this.outputInfoMap[assetName];
    }
}
exports.OutputAsset = OutputAsset;
