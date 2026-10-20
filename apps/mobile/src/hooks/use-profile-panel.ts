import type { Child } from '@/data/children';
import { errorKind } from '@/data/errors';
import {
  useChildInterests,
  useLearnerProfile,
  useSetPersonalization,
  useUniverseCatalogue,
} from '@/data/universe';
import { answersOf, chosenOf, questionsFor } from '@/data/universe-model';
import type { ProfilePanelState } from '@/screens/child-detail/profile-panel';

/** The parent's view of the child's personalization: consent, profile and universe. */
export function useProfilePanel(
  child: Child | undefined,
  onEditUniverse: () => void,
): ProfilePanelState {
  const enabled = Boolean(child?.personalization_consent_at);
  const catalogue = useUniverseCatalogue(enabled);
  const interests = useChildInterests(child?.id, enabled);
  const profile = useLearnerProfile(child?.id, enabled);
  const consent = useSetPersonalization(child?.id);
  return {
    enabled,
    profile: profile.data,
    chosen:
      catalogue.data && child
        ? chosenOf(questionsFor(catalogue.data, child.grade), answersOf(interests.data))
        : [],
    others: interests.data?.others ?? [],
    saving: consent.isPending,
    error: consent.error ? errorKind(consent.error) : null,
    onEnable: () => consent.mutate(true),
    onDisable: () => consent.mutate(false),
    onEditUniverse,
  };
}
