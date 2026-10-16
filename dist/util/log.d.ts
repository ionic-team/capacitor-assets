import { StreamOutputStrategy } from '@ionic/cli-framework-output';
export declare const output: StreamOutputStrategy;
export declare const logger: import("@ionic/cli-framework-output").Logger;
export declare function debug(...args: any[]): void;
export declare function log(...args: any[]): void;
export declare function warn(...args: any[]): void;
export declare function error(...args: any[]): void;
export declare function fatal(msg: string, exc?: Error): never;
