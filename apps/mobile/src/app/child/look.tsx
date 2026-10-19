import { themes } from '@math-genius/ui';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { ThemePreview } from '@/components/theme-preview';
import { useChild } from '@/data/children';
import { useBadges, useRewards } from '@/data/rewards';
import { wornItems } from '@/data/rewards-model';
import { useLookEditor } from '@/hooks/use-look-editor';
import { LookEditor } from '@/screens/look';

export default function LookRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const badges = useBadges(id);
  const rewards = useRewards(id);
  const earned = new Set((badges.data?.earned ?? []).map(({ badge_code }) => badge_code));
  const editor = useLookEditor(child.data, earned);

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
        accessory={wornItems(rewards.data?.items ?? []).accessory}
        earned={earned}
        hint={editor.hint}
        changed={editor.changed}
        saving={editor.saving}
        error={editor.error}
        onPart={editor.setPart}
        onTheme={editor.setTheme}
        onSave={() => editor.save(back)}
      />
    </ThemePreview>
  );
}
