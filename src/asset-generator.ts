import type { InputAsset } from './input-asset';
import type { OutputAsset } from './output-asset';
import type { Project } from './project';

export abstract class AssetGenerator {
  constructor(public options: AssetGeneratorOptions) {}

  abstract generate(asset: InputAsset, project: Project): Promise<OutputAsset[]>;
}

export interface AssetGeneratorOptions {
  // Background color for icon generation
  iconBackgroundColor?: string;
  // Background color for icon generation for use in dark mode scenarios
  iconBackgroundColorDark?: string;
  // Background color for light mode splash generation
  splashBackgroundColor?: string;
  // Background color for dark mode splash generation
  splashBackgroundColorDark?: string;
  // Path to the web app manifest
  pwaManifestPath?: string;
  // Whether to fetch latest device sizes from official apple site
  pwaNoAppleFetch?: boolean;
  // Scale amount for logo when generating splashes. Default: 0.2 (20%)
  logoSplashScale?: number;
  // Specific width for logo when generating splashes. (not used by default)
  logoSplashTargetWidth?: number;
  // Android product flavor name where generated assets will be created. Default: main
  androidFlavor?: string;
}
