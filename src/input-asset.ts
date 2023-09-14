import { basename, extname } from 'path';
import sharp from 'sharp';

import type { AssetGenerator } from './asset-generator';
import type { AssetKind, Platform } from './definitions';
import { Format } from './definitions';
import type { OutputAsset } from './output-asset';
import type { Project } from './project';

/**
 * An instance of an asset that we will use to generate
 * a number of output assets.
 */
export class InputAsset {
  private filename: string;
  public width?: number;
  public height?: number;

  private _sharp: sharp.Sharp | null = null;

  constructor(
    public path: string,
    public kind: AssetKind,
    public platform: Platform,
  ) {
    this.filename = basename(path);
  }

  pipeline(): sharp.Sharp | undefined {
    return this._sharp?.clone();
  }

  format(): Format.Jpeg | Format.Png | Format.Svg | Format.Unknown {
    const ext = extname(this.filename);

    switch (ext) {
      case '.png':
        return Format.Png;
      case '.jpg':
      case '.jpeg':
        return Format.Jpeg;
      case '.svg':
        return Format.Svg;
    }

    return Format.Unknown;
  }

  async load(): Promise<void> {
    this._sharp = await sharp(this.path);

    const metadata = await this._sharp.metadata();
    this.width = metadata.width;
    this.height = metadata.height;
  }

  async generate(strategy: AssetGenerator, project: Project): Promise<OutputAsset[]> {
    return strategy.generate(this, project);
  }
}
