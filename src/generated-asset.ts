import { Asset } from "./asset";
import { AssetMeta } from "./definitions";
import { Project } from "./project";

export class GeneratedAsset {
  constructor(public meta: AssetMeta, public asset: Asset, public project: Project) {
  }
}