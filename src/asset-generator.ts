import { Asset } from "./asset";
import { GeneratedAsset } from "./generated-asset";
import { Project } from "./project";

export abstract class AssetGenerator {
  constructor() { }

  abstract generate(asset: Asset, project: Project): Promise<GeneratedAsset[]>;
}