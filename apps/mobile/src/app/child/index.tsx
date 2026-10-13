import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/loading-screen';
import { useChildren } from '@/data/children';
import { useAccountKind } from '@/data/session';

/** Sends the child to pairing, profile choice or their home, depending on the device. */
export default function ChildEntryRoute() {
  const kind = useAccountKind();
  const children = useChildren();

  if (!kind) return <Redirect href="/child/pair" />;
  if (children.isPending) return <LoadingScreen />;

  const profiles = children.data ?? [];
  const [onlyProfile] = profiles;

  if (profiles.length === 0) {
    // A revoked device has no child left: it pairs again with the same session.
    return <Redirect href={kind === 'parent' ? '/parent' : '/child/pair'} />;
  }
  if (kind === 'device' && profiles.length === 1 && onlyProfile) {
    return <Redirect href={{ pathname: '/child/home', params: { id: onlyProfile.id } }} />;
  }
  return <Redirect href="/child/profiles" />;
}
