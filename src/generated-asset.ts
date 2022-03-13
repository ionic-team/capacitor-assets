import { OutputInfo } from 'sharp';
import { Asset } from './asset';
import { AssetMeta } from './definitions';
import { Project } from './project';

export class GeneratedAsset<AssetMetaType = AssetMeta> {
  constructor(
    public meta: AssetMetaType,
    public asset: Asset,
    public project: Project,
    public outputInfo: OutputInfo,
  ) {}
}
