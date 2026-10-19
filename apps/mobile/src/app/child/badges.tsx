import { useLocalSearchParams } from 'expo-router';

import { badgeGroups } from '@/data/badges-model';
import { useBadges } from '@/data/rewards';
import { Badges } from '@/screens/badges';

export default function BadgesRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const badges = useBadges(id);
  return <Badges groups={badges.data ? badgeGroups(badges.data) : null} />;
}
