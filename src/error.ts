export abstract class BaseError extends Error {
  abstract readonly name: string;
  abstract readonly code: string;

  constructor(readonly message: string) {
    super(message);
    this.stack = new Error().stack || '';
    this.message = message;
  }

  toString(): string {
    return this.message;
  }

  toJSON(): { [key: string]: any } {
    return {
      code: this.code,
      message: this.message,
    };
  }
}

export class BadProjectError extends BaseError {
  readonly name = 'BadProjectError';
  readonly code = 'BAD_PROJECT';
}
export class BadPipelineError extends BaseError {
  readonly name = 'BadPipelineError';
  readonly code = 'BAD_SHARP_PIPELINE';
}
