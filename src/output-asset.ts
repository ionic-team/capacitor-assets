import { OutputInfo } from 'sharp';
import { InputAsset } from './input-asset';
import { OutputAssetTemplate } from './definitions';
import { Project } from './project';

export class OutputAsset<OutputAssetTemplateType = OutputAssetTemplate> {
  constructor(
    public template: OutputAssetTemplateType,
    public asset: InputAsset,
    public project: Project,
    public outputInfo: OutputInfo,
  ) {}
}
