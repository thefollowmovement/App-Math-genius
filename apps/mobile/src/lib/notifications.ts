import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import type * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

import { strings } from '@/i18n';

type NotificationsModule = typeof ExpoNotifications;

/** Android channel of the reminders (channelId in supabase/migrations/*_reminders.sql). */
export const REMINDERS_CHANNEL = 'reminders';

/** Screens a notification may open (its data.url, written by the server). */
const APP_ROUTE = /^\/(child|parent)\//;

/**
 * Whether this phone gets push notifications. A child device reports it, so that its parent knows
 * when reminders cannot reach it: refused, or a browser or test app that has no push.
 */
export type PushSetup = { status: 'enabled'; token: string } | { status: 'denied' | 'unsupported' };

let loaded: NotificationsModule | null | undefined;

/**
 * expo-notifications, loaded on first use and never at startup: on Android, Expo Go no longer has
 * its native modules (removed in SDK 53) and loading the package there throws, which used to
 * crash every route. Null on web, on Android in Expo Go, or when the native module is missing.
 */
export function loadNotifications(): NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  loaded = null;
  if (Platform.OS === 'web' || (Platform.OS === 'android' && isRunningInExpoGo())) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional native module, see above.
    loaded = require('expo-notifications') as NotificationsModule;
  } catch {
    loaded = null;
  }
  return loaded;
}

/** Set by `eas init` in app.json (expo.extra.eas.projectId): Expo push tokens need it. */
export function easProjectId(): string | null {
  const extra: unknown = Constants.expoConfig?.extra;
  if (typeof extra !== 'object' || extra === null || !('eas' in extra)) return null;
  const { eas } = extra;
  if (typeof eas !== 'object' || eas === null || !('projectId' in eas)) return null;
  return typeof eas.projectId === 'string' ? eas.projectId : null;
}

/** Notifications received while the app is open show as a banner too. */
export function showNotificationsInForeground() {
  loadNotifications()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * This phone's push setup, asking for permission the first time. Unsupported without the native
 * module or an EAS project; null when the token could not be fetched (a simulator, or offline):
 * nothing is known yet.
 */
export async function pushSetup(): Promise<PushSetup | null> {
  const Notifications = loadNotifications();
  const projectId = easProjectId();
  if (!Notifications || !projectId) return { status: 'unsupported' };
  try {
    // Android 13 only asks for permission once a channel exists.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL, {
        name: strings.notifications.channel,
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const permission =
      current.granted || !current.canAskAgain
        ? current
        : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return { status: 'enabled', token: token.data };
  } catch {
    return null;
  }
}

/** The app screen a tapped notification asks for, if it is one of ours. */
export function notificationRoute(response: ExpoNotifications.NotificationResponse | null) {
  const url: unknown = response?.notification.request.content.data?.url;
  return typeof url === 'string' && APP_ROUTE.test(url) ? url : null;
}

/** Calls `open` with the screen of each tapped notification, including the one that opened the app. */
export function onNotificationTapped(open: (route: string) => void): () => void {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};
  const initial = notificationRoute(Notifications.getLastNotificationResponse());
  if (initial) open(initial);
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = notificationRoute(response);
    if (route) open(route);
  });
  return () => subscription.remove();
}
