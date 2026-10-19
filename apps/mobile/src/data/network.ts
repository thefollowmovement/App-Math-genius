import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

let listening = false;

/**
 * TanStack Query follows the real connection: queries pause offline and resume after. On the web
 * it already listens to the browser's online and offline events; NetInfo would not (in Chromium
 * it only watches `navigator.connection`, which does not report coming back online).
 */
export function startNetworkListener() {
  if (listening || Platform.OS === 'web') return;
  listening = true;
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );
}

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);

export function useIsOnline(): boolean {
  return useSyncExternalStore(subscribe, () => onlineManager.isOnline());
}
