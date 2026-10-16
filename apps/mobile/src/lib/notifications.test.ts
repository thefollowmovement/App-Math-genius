import * as Notifications from 'expo-notifications';

import { notificationRoute, pushToken } from './notifications';

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

describe('push token', () => {
  it('asks once, then returns the Expo push token', async () => {
    permissions.mockResolvedValue(status(false));
    request.mockResolvedValue(status(true));
    await expect(pushToken()).resolves.toBe('ExponentPushToken[abc]');
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-1' });
  });

  it('does not ask again once refused', async () => {
    permissions.mockResolvedValue(status(false, false));
    await expect(pushToken()).resolves.toBeNull();
    expect(request).not.toHaveBeenCalled();
  });

  it('needs an EAS project', async () => {
    mockExtra = {};
    await expect(pushToken()).resolves.toBeNull();
    expect(permissions).not.toHaveBeenCalled();
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
