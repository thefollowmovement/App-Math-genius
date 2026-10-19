import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export type NativeStyle = ViewStyle & TextStyle;
type HostNode = {
  type: string;
  props: { style?: NativeStyle | NativeStyle[] };
  children: (HostNode | string)[] | null;
};

/**
 * global.css as the app gets it on iOS and Android: compiled by Tailwind in its own Node process
 * (as under Metro), then registered with the options of metro.config.js. Pass the result to
 * `registerCSS` from react-native-css/jest in a `beforeEach`.
 */
export function compileGlobalCss(): string {
  const script = join(__dirname, '../../scripts/compile-tailwind.mjs');
  return execFileSync(process.execPath, [script], { encoding: 'utf8' });
}

// Same compiler options as metro.config.js.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const nativeCssOptions = require('../../native-css.config');

/** Every host view of a rendered tree with its flattened style. */
export function hostStyles(node: unknown): { type: string; style: NativeStyle }[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(hostStyles);
  const host = node as HostNode;
  const children = (host.children ?? []).filter(
    (child): child is HostNode => typeof child !== 'string',
  );
  return [
    { type: host.type, style: StyleSheet.flatten(host.props.style) ?? {} },
    ...hostStyles(children),
  ];
}

const LAYOUT_KEYS =
  /^(gap|rowGap|columnGap|padding\w*|margin\w*|maxWidth|minWidth|width|height|borderRadius)$/;

/**
 * Layout values that are not finite numbers between 0 and `limit` (500 by default; percentages
 * are allowed).
 */
export function unreasonableLayoutValues(styles: { style: NativeStyle }[], limit = 500): string[] {
  return styles.flatMap(({ style }) =>
    Object.entries(style)
      .filter(([key]) => LAYOUT_KEYS.test(key))
      .filter(([, value]) => !(typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value)))
      .filter(([key, value]) => {
        const max = key === 'borderRadius' ? 10_000 : limit;
        return typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max;
      })
      .map(([key, value]) => `${key}: ${String(value)}`),
  );
}

/** Texts whose line height is missing or not between 1 and 2 times their font size. */
export function badLineHeights(styles: { type: string; style: NativeStyle }[]): string[] {
  return styles
    .filter(({ type, style }) => type === 'Text' && style.fontSize !== undefined)
    .filter(({ style }) => {
      const { fontSize = 0, lineHeight } = style;
      return typeof lineHeight !== 'number' || lineHeight < fontSize || lineHeight > fontSize * 2;
    })
    .map(
      ({ style }) => `fontSize ${String(style.fontSize)} / lineHeight ${String(style.lineHeight)}`,
    );
}
