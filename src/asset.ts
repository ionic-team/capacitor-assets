import { basename, join } from "path";
import sharp from "sharp";
import { AssetKind } from "./definitions";

export class Asset {
  private filename: string;
  private width?: number;
  private height?: number;

  private _sharp: sharp.Sharp | null = null;

  constructor(private path: string, private kind: AssetKind) {
    this.filename = basename(path);
  }

  async load(): Promise<void> {
    console.log('Loading image', this.path);
    this._sharp = await sharp(this.path);

    const metadata = await this._sharp.metadata();
    this.width = metadata.width;
    this.height = metadata.height;

    console.log('Loaded asset', this.filename, this.width, this.height);
  }
}