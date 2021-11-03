import { Asset } from "./asset";

export interface Assets {
  icon: Asset | null;
  splash: Asset | null;
  splashDark: Asset | null;
};

export const enum AssetKind {
  Icon = 'icon',
  Splash = 'splash',
  SplashDark = 'splash-dark'
};
