import { Asset } from "./asset";
import { GeneratedAsset } from "./generated-asset";
import { Project } from "./project";

export abstract class AssetGenerationStrategy {
  constructor() { }

  abstract generate(asset: Asset, project: Project): Promise<GeneratedAsset[]>;
}