import { themes } from '@math-genius/ui';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { ThemePreview } from '@/components/theme-preview';
import { useChild } from '@/data/children';
import { useBadges, useRewards } from '@/data/rewards';
import { unlockedOf } from '@/data/rewards-model';
import { useLookEditor } from '@/hooks/use-look-editor';
import { LookEditor } from '@/screens/look';

export default function LookRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const badges = useBadges(id);
  const rewards = useRewards(id);
  // Until they load, badge and shop cosmetics show as locked (the server checks them anyway).
  const unlocked = unlockedOf(
    badges.data?.earned ?? [],
    rewards.data?.items ?? [],
    rewards.data?.kept ?? [],
  );
  const editor = useLookEditor(child.data, unlocked);

  if (child.isPending) return <LoadingScreen />;
  if (!editor.look) return <Redirect href="/child" />;

  const back = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/child/home', params: { id } });

  return (
    // The whole screen previews the theme being chosen.
    <ThemePreview theme={themes[editor.look.theme]}>
      <LookEditor
        look={editor.look}
        unlocked={unlocked}
        hint={editor.hint}
        changed={editor.changed}
        saving={editor.saving}
        error={editor.error}
        onHero={editor.setHero}
        onCosmetic={editor.setCosmetic}
        onTheme={editor.setTheme}
        onSave={() => editor.save(back)}
      />
    </ThemePreview>
  );
}
