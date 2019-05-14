import util from 'util';

import { ResourceType } from './resources';

export const enum ValidationErrorCode {
  BAD_IMAGE_FORMAT = 'BAD_IMAGE_FORMAT',
  BAD_IMAGE_SIZE = 'BAD_IMAGE_SIZE',
}

export interface BadImageFormatValidationErrorDetails {
  source: string;
  type: ResourceType;
  code: ValidationErrorCode.BAD_IMAGE_FORMAT;
  format: string | undefined;
  requiredFormats: string[];
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

export type ValidationErrorDetails = (
  BadImageFormatValidationErrorDetails |
  BadImageSizeValidationErrorDetails
);

export class BaseError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.stack = (new Error()).stack || '';
    this.message = message;
  }

  toString(): string {
    return (
      `Error: ${this.message} ${util.inspect(this, { breakLength: Infinity })}`
    );
  }

  toJSON(): { [key: string]: any; } {
    return { code: 'UNKNOWN', message: this.toString() };
  }
}

export class ValidationError extends BaseError {
  constructor(readonly message: string, readonly details: ValidationErrorDetails) {
    super(message);
  }

  toString(): string {
    return this.message;
  }

  toJSON() {
    return { code: 'BAD_SOURCE', details: this.details };
  }
}

export class ResolveSourceImageError extends BaseError {
  constructor(readonly message: string, readonly errors: ReadonlyArray<ValidationError>) {
    super(message);
  }

  toJSON() {
    return { code: 'BAD_SOURCES', sourceErrors: this.errors };
  }
}
