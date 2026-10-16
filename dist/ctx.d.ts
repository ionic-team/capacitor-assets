import type { AssetGeneratorOptions } from './asset-generator';
import { Project } from './project';
export interface Context {
    projectRootPath?: string;
    args: AssetGeneratorOptions | any;
    project: Project;
    nodePackageRoot: string;
    rootDir: string;
}
export declare function loadContext(projectRootPath?: string): Promise<Context>;
export declare function setArguments(ctx: Context, args: any): void;
