// Stand-in for @shopify/react-native-skia in Jest, where Skia's native views and CanvasKit do not
// exist. The canvas is a plain view that draws nothing (its scenes never mount); pictures, images
// and fonts never load. The scenes' worlds are pure and tested on their own (src/games).
import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

export function Canvas({ style }: ViewProps & { children?: ReactNode }) {
  return <View testID="game-canvas" style={style} />;
}

export const Picture = () => null;
export const useImage = () => null;
export const useFont = () => null;
export const createPicture = () => null;
export const PaintStyle = { Fill: 0, Stroke: 1 };
export const Skia = {};
