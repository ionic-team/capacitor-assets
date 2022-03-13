import { OutputInfo } from 'sharp';
import { InputAsset } from './input-asset';
import { AssetMeta } from './definitions';
import { Project } from './project';

export class OutputAsset<AssetMetaType = AssetMeta> {
  constructor(
    public meta: AssetMetaType,
    public asset: InputAsset,
    public project: Project,
    public outputInfo: OutputInfo,
  ) {}
}
