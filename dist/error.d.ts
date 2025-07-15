export declare abstract class BaseError extends Error {
    readonly message: string;
    abstract readonly name: string;
    abstract readonly code: string;
    constructor(message: string);
    toString(): string;
    toJSON(): {
        [key: string]: any;
    };
}
export declare class BadProjectError extends BaseError {
    readonly name = "BadProjectError";
    readonly code = "BAD_PROJECT";
}
export declare class BadPipelineError extends BaseError {
    readonly name = "BadPipelineError";
    readonly code = "BAD_SHARP_PIPELINE";
}
