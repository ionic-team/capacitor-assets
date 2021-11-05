import { basename, extname, join } from "path";
import sharp from "sharp";
import { AssetKind, Format } from "./definitions";
import { GeneratedAsset } from "./generated-asset";
import { Project } from "./project";
import { AssetGenerationStrategy } from "./strategy";

export class Asset {
  private filename: string;
  public width?: number;
  public height?: number;

  private _sharp: sharp.Sharp | null = null;

  constructor(private path: string, public kind: AssetKind) {
    this.filename = basename(path);
  }

  pipeline() {
    return this._sharp;
  }

  format() {
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

  async generate(strategy: AssetGenerationStrategy, project: Project): Promise<GeneratedAsset[]> {
    return strategy.generate(this, project);
  }
}