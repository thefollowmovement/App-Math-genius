import { Asset } from 'expo-asset';

/**
 * On the web, Skia cannot resolve a bundled asset id (it asks React Native's asset registry, which
 * react-native-web does not have): it gets the asset's URL instead.
 */
export const assetSource = (asset: number): number | string => Asset.fromModule(asset).uri;
