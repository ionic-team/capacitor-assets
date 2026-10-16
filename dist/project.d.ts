import type { MobileProjectConfig } from '@trapezedev/project';
import { MobileProject } from '@trapezedev/project';
import type { Assets } from './definitions';
export declare class Project extends MobileProject {
    private assetPath;
    assets: Assets | null;
    directory: string | null;
    assetDir: string;
    constructor(projectRoot: string | undefined, config: MobileProjectConfig, assetPath?: string);
    detectAssetDir(): Promise<void>;
    androidExists(): Promise<boolean>;
    iosExists(): Promise<boolean>;
    assetDirExists(): Promise<boolean>;
    assetDirectory(): string;
    loadInputAssets(): Promise<Assets>;
    private loadLogoInputAsset;
    private loadInputAsset;
}
