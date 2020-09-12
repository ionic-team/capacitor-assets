import type { ResourceType } from './resources';

export const enum ValidationErrorCode {
  BAD_IMAGE_FORMAT = 'BAD_IMAGE_FORMAT',
  BAD_IMAGE_SIZE = 'BAD_IMAGE_SIZE',
}

export interface BadImageFormatValidationErrorDetails {
  source: string;
  type: ResourceType;
  code: ValidationErrorCode.BAD_IMAGE_FORMAT;
  format: string | undefined;
  requiredFormats: readonly string[];
}

export interface BadImageSizeValidationErrorDetails {
  source: string;
  type: ResourceType;
  code: ValidationErrorCode.BAD_IMAGE_SIZE;
  width: number | undefined;
  height: number | undefined;
  requiredWidth: number;
  requiredHeight: number;
}

export type ValidationErrorDetails =
  | BadImageFormatValidationErrorDetails
  | BadImageSizeValidationErrorDetails;

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

export class BadInputError extends BaseError {
  readonly name = 'BadInputError';
  readonly code = 'BAD_INPUT';
}

export class ValidationError extends BaseError {
  readonly name = 'ValidationError';
  readonly code = 'BAD_SOURCE';

  constructor(
    readonly message: string,
    readonly details: ValidationErrorDetails,
  ) {
    super(message);
  }

  toJSON(): { [key: string]: any } {
    return { ...super.toJSON(), details: this.details };
  }
}

export class ResolveSourceImageError extends BaseError {
  readonly name = 'ResolveSourceImageError';
  readonly code = 'BAD_SOURCES';

  constructor(
    readonly message: string,
    readonly errors: readonly ValidationError[],
  ) {
    super(message);
  }

  toJSON(): { [key: string]: any } {
    return { ...super.toJSON(), sourceErrors: this.errors };
  }
}
