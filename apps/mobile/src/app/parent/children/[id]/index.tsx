import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useSendChildMessage } from '@/data/child-messages';
import { useChild } from '@/data/children';
import { errorKind } from '@/data/errors';
import { useRevokeDevice } from '@/data/devices';
import { useTodaySessions } from '@/data/family-sessions';
import { useGameRoom, useSetGameLimit } from '@/data/games';
import { gameRoomView } from '@/data/games-model';
import { usePlacement } from '@/data/placement';
import { placementAvailable } from '@/data/placement-model';
import { placementReport } from '@/data/placement-report';
import { useRewards } from '@/data/rewards';
import { routineOf, vacationsOf } from '@/data/routine-plan';
import { useRoutines } from '@/data/routines';
import { usePairingPanel } from '@/hooks/use-pairing-panel';
import { useParentRewardsPanel } from '@/hooks/use-parent-rewards-panel';
import { useProfilePanel } from '@/hooks/use-profile-panel';
import { ChildDetail } from '@/screens/child-detail';

export default function ChildDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const panel = usePairingPanel(id);
  const revokeDevice = useRevokeDevice();
  const sessions = useTodaySessions();
  const routines = useRoutines();
  const rewards = useRewards(id);
  const message = useSendChildMessage(id);
  const parentRewards = useParentRewardsPanel(id);
  const placement = usePlacement(id);
  const gameRoom = useGameRoom(id);
  const gameLimit = useSetGameLimit(id);
  const profile = useProfilePanel(child.data, () =>
    router.push({ pathname: '/parent/children/[id]/universe', params: { id } }),
  );

  if (!child.data) return <LoadingScreen />;
  // The child's day, as the server counts it (the family's time zone).
  const games = gameRoom.data
    ? gameRoomView({
        server: gameRoom.data,
        local: undefined,
        today: gameRoom.data.localDate,
        limitMinutes: child.data.game_minutes_limit,
      })
    : undefined;

  return (
    <>
      <Stack.Title>{child.data.display_name}</Stack.Title>
      <ChildDetail
        child={child.data}
        progress={rewards.data?.progress}
        badges={rewards.data?.badges}
        sessions={(sessions.data ?? []).filter((session) => session.child_id === id)}
        onOpenSession={(sessionId) =>
          router.push({ pathname: '/parent/sessions/[id]', params: { id: sessionId } })
        }
        placement={placementReport(placement.data)}
        placementAvailable={placementAvailable(child.data.grade)}
        routine={routineOf(routines.data, id)}
        vacations={vacationsOf(routines.data, id)}
        onEditRoutine={() =>
          router.push({ pathname: '/parent/children/[id]/routine', params: { id } })
        }
        rewards={parentRewards}
        games={{
          limitMinutes: gameLimit.isPending
            ? (gameLimit.variables ?? child.data.game_minutes_limit)
            : child.data.game_minutes_limit,
          today: games && {
            playedMinutes: games.playedMinutes,
            gems: games.gemsToday,
            gemsCap: games.gemsCap,
          },
          saving: gameLimit.isPending,
          error: gameLimit.error ? errorKind(gameLimit.error) : null,
          onChangeLimit: (minutes) => gameLimit.mutate(minutes),
        }}
        profile={profile}
        nudge={{
          onSend: (text) => message.mutate(text),
          sending: message.isPending,
          result: message.data === undefined ? null : message.data > 0 ? 'sent' : 'no_device',
          error: message.error ? errorKind(message.error) : null,
        }}
        pairing={panel.pairing}
        creatingCode={panel.creatingCode}
        pairingError={panel.pairingError}
        onCreateCode={panel.createCode}
        devices={panel.devices}
        revokingDeviceId={revokeDevice.isPending ? revokeDevice.variables : null}
        onRevokeDevice={(deviceId) => revokeDevice.mutate(deviceId)}
      />
    </>
  );
}
