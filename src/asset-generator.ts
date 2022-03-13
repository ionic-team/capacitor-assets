import { InputAsset } from './input-asset';
import { OutputAsset } from './output-asset';
import { Project } from './project';

export abstract class AssetGenerator {
  constructor() {}

  abstract generate(
    asset: InputAsset,
    project: Project,
  ): Promise<OutputAsset[]>;
}
