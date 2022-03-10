import { Asset } from '../../asset';
import { AssetGenerator } from '../../asset-generator';
import { GeneratedAsset } from '../../generated-asset';
import { Project } from '../../project';

export class AndroidAssetGenerator extends AssetGenerator {
  constructor() {
    super();
  }

  async generate(asset: Asset, project: Project): Promise<GeneratedAsset[]> {
    return [];
  }
}
