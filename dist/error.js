"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadPipelineError = exports.BadProjectError = exports.BaseError = void 0;
class BaseError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.stack = new Error().stack || '';
        this.message = message;
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
    constructor() {
        super(...arguments);
        this.name = 'BadProjectError';
        this.code = 'BAD_PROJECT';
    }
}
exports.BadProjectError = BadProjectError;
class BadPipelineError extends BaseError {
    constructor() {
        super(...arguments);
        this.name = 'BadPipelineError';
        this.code = 'BAD_SHARP_PIPELINE';
    }
}
exports.BadPipelineError = BadPipelineError;
