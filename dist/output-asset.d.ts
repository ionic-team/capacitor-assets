import type { OutputInfo } from 'sharp';
import type { OutputAssetTemplate } from './definitions';
import type { InputAsset } from './input-asset';
import type { Project } from './project';
/**
 * An instance of a generated asset
 */
export declare class OutputAsset<OutputAssetTemplateType = OutputAssetTemplate> {
    template: OutputAssetTemplateType;
    asset: InputAsset;
    project: Project;
    destFilenames: {
        [name: string]: string;
    };
    outputInfoMap: {
        [name: string]: OutputInfo;
    };
    constructor(template: OutputAssetTemplateType, asset: InputAsset, project: Project, destFilenames: {
        [name: string]: string;
    }, outputInfoMap: {
        [name: string]: OutputInfo;
    });
    getDestFilename(assetName: string): string;
    getOutputInfo(assetName: string): OutputInfo;
}
