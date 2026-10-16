import * as Notifications from 'expo-notifications';

import { notificationRoute, pushSetup } from './notifications';

let mockExtra: unknown = { eas: { projectId: 'project-1' } };

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: mockExtra };
    },
  },
}));
jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 6 },
  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ type: 'expo', data: 'ExponentPushToken[abc]' }),
  ),
}));

const permissions = jest.mocked(Notifications.getPermissionsAsync);
const request = jest.mocked(Notifications.requestPermissionsAsync);
const status = (granted: boolean, canAskAgain = true) =>
  ({
    granted,
    canAskAgain,
    expires: 'never',
    status: granted ? 'granted' : 'undetermined',
  }) as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

beforeEach(() => {
  mockExtra = { eas: { projectId: 'project-1' } };
  jest.clearAllMocks();
});

describe('push setup', () => {
  it('asks once, then returns the Expo push token', async () => {
    permissions.mockResolvedValue(status(false));
    request.mockResolvedValue(status(true));
    await expect(pushSetup()).resolves.toEqual({
      status: 'enabled',
      token: 'ExponentPushToken[abc]',
    });
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-1' });
  });

  it('does not ask again once refused', async () => {
    permissions.mockResolvedValue(status(false, false));
    await expect(pushSetup()).resolves.toEqual({ status: 'denied' });
    expect(request).not.toHaveBeenCalled();
  });

  it('needs an EAS project', async () => {
    mockExtra = {};
    await expect(pushSetup()).resolves.toEqual({ status: 'unsupported' });
    expect(permissions).not.toHaveBeenCalled();
  });

  it('knows nothing yet when the token cannot be fetched (simulator, offline)', async () => {
    permissions.mockResolvedValue(status(true));
    jest.mocked(Notifications.getExpoPushTokenAsync).mockRejectedValueOnce(new Error('offline'));
    await expect(pushSetup()).resolves.toBeNull();
  });
});

describe('optional native module', () => {
  /**
   * Runs `check` on a fresh copy of the module, on `os`, in or out of Expo Go, where loading
   * expo-notifications throws as when its native module is missing (the app start with a missing
   * module is tested in src/app-start.test.tsx).
   */
  async function isolated(
    os: 'ios' | 'android',
    expoGo: boolean,
    check: (notifications: typeof import('./notifications')) => Promise<void>,
  ) {
    const factory = jest.fn(() => {
      throw new Error("Cannot find native module 'ExpoTopicSubscriptionModule'");
    });
    await jest.isolateModulesAsync(async () => {
      jest.doMock('expo-notifications', factory);
      jest.doMock('expo', () => ({ isRunningInExpoGo: () => expoGo }));
      /* eslint-disable @typescript-eslint/no-require-imports -- required in the isolated registry. */
      const { Platform } = require('react-native') as typeof import('react-native');
      jest.replaceProperty(Platform, 'OS', os);
      await check(require('./notifications') as typeof import('./notifications'));
      /* eslint-enable @typescript-eslint/no-require-imports */
    });
    return factory;
  }

  it('is never loaded on Android in Expo Go, where loading it crashes', async () => {
    const factory = await isolated('android', true, async (notifications) => {
      expect(notifications.loadNotifications()).toBeNull();
      expect(() => notifications.showNotificationsInForeground()).not.toThrow();
      expect(notifications.onNotificationTapped(jest.fn())).toEqual(expect.any(Function));
      await expect(notifications.pushSetup()).resolves.toEqual({ status: 'unsupported' });
    });
    expect(factory).not.toHaveBeenCalled();
  });
});

describe('tapped notifications', () => {
  const tapped = (data: Record<string, unknown>) =>
    ({
      notification: { request: { content: { data } } },
    }) as unknown as Notifications.NotificationResponse;

  it('open the app screen the server asked for, and nothing else', () => {
    expect(notificationRoute(tapped({ url: '/parent/children/lea' }))).toBe('/parent/children/lea');
    expect(notificationRoute(tapped({ url: '/child/home?id=lea' }))).toBe('/child/home?id=lea');
    expect(notificationRoute(tapped({ url: 'https://example.com' }))).toBeNull();
    expect(notificationRoute(tapped({}))).toBeNull();
    expect(notificationRoute(null)).toBeNull();
  });
});
