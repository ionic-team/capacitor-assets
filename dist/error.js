"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadPipelineError = exports.BadProjectError = exports.BaseError = void 0;
class BaseError extends Error {
    message;
    constructor(message) {
        super(message);
        this.message = message;
        this.stack = new Error().stack || '';
    }
    toString() {
        return this.message;
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
        };
    }
}
exports.BaseError = BaseError;
class BadProjectError extends BaseError {
    name = 'BadProjectError';
    code = 'BAD_PROJECT';
}
exports.BadProjectError = BadProjectError;
class BadPipelineError extends BaseError {
    name = 'BadPipelineError';
    code = 'BAD_SHARP_PIPELINE';
}
exports.BadPipelineError = BadPipelineError;
