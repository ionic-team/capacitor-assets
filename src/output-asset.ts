import { OutputInfo } from 'sharp';
import { InputAsset } from './input-asset';
import { OutputAssetTemplate } from './definitions';
import { Project } from './project';

export class OutputAsset<OutputAssetTemplateType = OutputAssetTemplate> {
  constructor(
    public template: OutputAssetTemplateType,
    public asset: InputAsset,
    public project: Project,
    public destFilenames: { [name: string]: string },
    public outputInfoMap: { [name: string]: OutputInfo },
  ) {}

  getDestFilename(assetName: string) {
    return this.destFilenames[assetName];
  }

  getOutputInfo(assetName: string) {
    return this.outputInfoMap[assetName];
  }
}
