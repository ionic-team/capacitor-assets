import type { AssetGeneratorOptions } from '../../asset-generator';
import { AssetGenerator } from '../../asset-generator';
import type { InputAsset } from '../../input-asset';
import { OutputAsset } from '../../output-asset';
import type { Project } from '../../project';
export declare const IOS_APP_ICON_SET_NAME = "AppIcon";
export declare const IOS_APP_ICON_SET_PATH = "App/Assets.xcassets/AppIcon.appiconset";
export declare const IOS_SPLASH_IMAGE_SET_NAME = "Splash";
export declare const IOS_SPLASH_IMAGE_SET_PATH = "App/Assets.xcassets/Splash.imageset";
export declare class IosAssetGenerator extends AssetGenerator {
    constructor(options?: AssetGeneratorOptions);
    generate(asset: InputAsset, project: Project): Promise<OutputAsset[]>;
    /**
     * The icon templates to generate from a primary (light) icon source.
     * Dark/tinted variants are auto-derived unless the project provides
     * explicit ios/icon-dark or ios/icon-tinted sources, which are then
     * generated in their own pass.
     */
    private iconTemplates;
    private generateFromLogo;
    private _generateIcons;
    private generateIconsForLogo;
    private generateIcons;
    private generateSplashes;
    private updateIconsContentsJson;
    private updateSplashContentsJson;
    private updateSplashContentsJsonDark;
}
