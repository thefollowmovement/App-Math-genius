'use client';

import { Badge, Button, Card, Checkbox, Loading, Notice, PageHeader } from '@/components/ui';
import { useMiniGames, useUpdateMiniGames } from '@/data/games';
import { strings } from '@/i18n/fr';
import { errorText } from '@/lib/errors';
import { reorder } from '@/models/games';

const t = strings.games;

/**
 * The mini-games of the game room: each one offered to the children or not, in order. The app
 * reads this table: a game turned off leaves the room without an update.
 */
export function GamesView() {
  const games = useMiniGames();
  const update = useUpdateMiniGames();
  const list = games.data ?? [];
  const error = games.error ?? update.error;

  return (
    <>
      <PageHeader title={strings.pages.jeux} intro={t.intro} />
      {error ? <Notice tone="danger">{errorText(error)}</Notice> : null}
      {games.isPending ? (
        <Loading label={strings.loading} />
      ) : (
        list.map((game, index) => (
          <Card
            key={game.id}
            title={t.items[game.id].name}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={game.enabled ? 'success' : 'neutral'}>
                  {game.enabled ? t.on : t.off}
                </Badge>
                <Button
                  small
                  disabled={index === 0 || update.isPending}
                  aria-label={`${t.up} : ${t.items[game.id].name}`}
                  onClick={() =>
                    update.mutate(
                      reorder(list, index, -1).map(({ id, position }) => ({
                        id,
                        fields: { position },
                      })),
                    )
                  }
                >
                  ↑
                </Button>
                <Button
                  small
                  disabled={index === list.length - 1 || update.isPending}
                  aria-label={`${t.down} : ${t.items[game.id].name}`}
                  onClick={() =>
                    update.mutate(
                      reorder(list, index, 1).map(({ id, position }) => ({
                        id,
                        fields: { position },
                      })),
                    )
                  }
                >
                  ↓
                </Button>
              </div>
            }
          >
            <p className="text-muted">{t.items[game.id].pitch}</p>
            <Checkbox
              label={t.offered}
              checked={game.enabled}
              disabled={update.isPending}
              onChange={(enabled) => update.mutate([{ id: game.id, fields: { enabled } }])}
            />
          </Card>
        ))
      )}
    </>
  );
}
