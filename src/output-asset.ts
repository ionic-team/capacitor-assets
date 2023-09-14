import type { OutputInfo } from 'sharp';

import type { OutputAssetTemplate } from './definitions';
import type { InputAsset } from './input-asset';
import type { Project } from './project';

/**
 * An instance of a generated asset
 */
export class OutputAsset<OutputAssetTemplateType = OutputAssetTemplate> {
  constructor(
    public template: OutputAssetTemplateType,
    public asset: InputAsset,
    public project: Project,
    public destFilenames: { [name: string]: string },
    public outputInfoMap: { [name: string]: OutputInfo },
  ) {}

  getDestFilename(assetName: string): string {
    return this.destFilenames[assetName];
  }

  getOutputInfo(assetName: string): OutputInfo {
    return this.outputInfoMap[assetName];
  }
}
