const LOCAL_URL = /^(https?:\/\/)(?:127\.0\.0\.1|localhost)(:\d+)?(\/.*)?$/i;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/**
 * On a phone, 127.0.0.1 is the phone itself. In development the computer that runs Metro also
 * runs local Supabase, so a local URL takes Metro's host instead: Expo Go reports it as
 * `hostUri` (`192.168.1.20:8081`). Only a network address is used: a tunnel host
 * (`--tunnel`, `*.exp.direct`) only forwards Metro, not Supabase, so the URL is then kept.
 */
export function urlOnMetroHost(url: string, metroHostUri: string | null | undefined): string {
  const local = LOCAL_URL.exec(url);
  const host = metroHostUri?.split(':')[0];
  if (!local || !host || !IPV4.test(host) || host === '127.0.0.1') return url;
  const [, scheme, port = '', path = ''] = local;
  return `${scheme}${host}${port}${path}`;
}
