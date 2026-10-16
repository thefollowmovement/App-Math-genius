import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { strings } from '@/i18n';

/** Android channel of the reminders (channelId in supabase/migrations/*_reminders.sql). */
export const REMINDERS_CHANNEL = 'reminders';

/** Screens a notification may open (its data.url, written by the server). */
const APP_ROUTE = /^\/(child|parent)\//;

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
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * This phone's Expo push token, asking for permission the first time. Null on web, without an EAS
 * project, when notifications are refused, or on a simulator.
 */
export async function pushToken(): Promise<string | null> {
  const projectId = easProjectId();
  if (Platform.OS === 'web' || !projectId) return null;
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
  if (!permission.granted) return null;
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return null;
  }
}

/** The app screen a tapped notification asks for, if it is one of ours. */
export function notificationRoute(response: Notifications.NotificationResponse | null) {
  const url: unknown = response?.notification.request.content.data?.url;
  return typeof url === 'string' && APP_ROUTE.test(url) ? url : null;
}

/** Calls `open` with the screen of each tapped notification, including the one that opened the app. */
export function onNotificationTapped(open: (route: string) => void): () => void {
  if (Platform.OS === 'web') return () => {};
  const initial = notificationRoute(Notifications.getLastNotificationResponse());
  if (initial) open(initial);
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = notificationRoute(response);
    if (route) open(route);
  });
  return () => subscription.remove();
}
