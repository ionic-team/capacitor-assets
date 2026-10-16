import sharp from 'sharp';
import type { AssetGenerator } from './asset-generator';
import type { AssetKind, Platform } from './definitions';
import { Format } from './definitions';
import type { OutputAsset } from './output-asset';
import type { Project } from './project';
/**
 * An instance of an asset that we will use to generate
 * a number of output assets.
 */
export declare class InputAsset {
    path: string;
    kind: AssetKind;
    platform: Platform;
    private filename;
    width?: number;
    height?: number;
    private _sharp;
    constructor(path: string, kind: AssetKind, platform: Platform);
    pipeline(): sharp.Sharp | undefined;
    format(): Format.Jpeg | Format.Png | Format.Svg | Format.Unknown;
    load(): Promise<void>;
    generate(strategy: AssetGenerator, project: Project): Promise<OutputAsset[]>;
}
