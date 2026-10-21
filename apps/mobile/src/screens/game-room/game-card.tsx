import type { MiniGameId } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';
import { Image } from 'expo-image';

import { Icon } from '@/components/game/icons';
import type { GameCard as GameCardData } from '@/data/games-model';
import { strings } from '@/i18n';

import bulle from '../../../assets/games/bulle.webp';
import coeur from '../../../assets/games/coeur.webp';
import croquettes from '../../../assets/games/croquettes.webp';
import fondPeche from '../../../assets/games/fond-peche.webp';
import fondPluie from '../../../assets/games/fond-pluie.webp';
import fondVol from '../../../assets/games/fond-vol.webp';
import gemme from '../../../assets/games/gemme.webp';
import poisson from '../../../assets/games/poisson.webp';

const t = strings.games;

/** Each game's card: a corner of its scene, and one of its objects. */
const THUMBS: Record<MiniGameId, { background: number; sprite: number }> = {
  'peche-eclair': { background: fondPeche, sprite: poisson },
  'pluie-de-gemmes': { background: fondPluie, sprite: gemme },
  'vol-du-chaton': { background: fondVol, sprite: bulle },
  'bulles-magiques': { background: fondPluie, sprite: bulle },
  'memory-du-compagnon': { background: fondVol, sprite: coeur },
  'course-des-croquettes': { background: fondPluie, sprite: croquettes },
};

/** Stars in a row, small: a game's best. */
function SmallStars({ count }: { count: number }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t.room.stars(count)}
      className="flex-row gap-1"
    >
      {[0, 1, 2].map((index) => (
        <Icon key={index} name="star" size="sm" color={index < count ? 'accent' : 'border'} />
      ))}
    </View>
  );
}

type GameCardProps = {
  card: GameCardData;
  /** False when today's time is up or the games are off. */
  open: boolean;
  onPlay: () => void;
};

export function GameCard({ card, open, onPlay }: GameCardProps) {
  const item = t.items[card.id];
  const thumb = THUMBS[card.id];
  return (
    <View className="overflow-hidden rounded-lg border-2 border-border bg-surface">
      <View className="h-24 flex-row items-center justify-center">
        <Image
          source={thumb.background}
          contentFit="cover"
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <Image
          source={thumb.sprite}
          contentFit="contain"
          style={{ width: 64, height: 64, opacity: card.ready ? 1 : 0.5 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      <View className="gap-3 p-4">
        <View className="flex-row items-center justify-between gap-2">
          <ThemedText variant="headline" className="flex-1">
            {item.name}
          </ThemedText>
          <SmallStars count={card.stars} />
        </View>
        <ThemedText tone="muted">{item.pitch}</ThemedText>
        <ThemedText variant="caption">
          {card.record === null ? t.room.noRecord : t.room.record(card.record)}
        </ThemedText>
        {card.ready ? (
          <Button
            title={t.play.start}
            accessibilityLabel={t.room.play(item.name)}
            icon={<Icon name="play" color="onPrimary" size="sm" />}
            disabled={!open}
            onPress={onPlay}
          />
        ) : (
          <Button title={t.room.soon} variant="outline" disabled onPress={() => undefined} />
        )}
      </View>
    </View>
  );
}
