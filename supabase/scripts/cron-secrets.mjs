// Stores in the local database's Vault what the nightly learner-profiles job needs to call its
// Edge Function: the API's address seen from the database container, and the local service key.
// `pnpm supabase:reset` empties Vault: run `pnpm supabase:cron-secrets` again after it.
// For the online project, see CLAUDE.md (SQL to run once in the dashboard).
import { execFileSync } from 'node:child_process';

const supabase = (...args) =>
  execFileSync('pnpm', ['exec', 'supabase', ...args], { encoding: 'utf8' });

const status = JSON.parse(supabase('status', '-o', 'json'));
const key = status.SERVICE_ROLE_KEY;
if (!key) throw new Error('Supabase local is not running: `pnpm supabase:start` first.');

const literal = (value) => `'${String(value).replace(/'/g, "''")}'`;
const secret = (name, value) => `
  perform vault.update_secret(id, ${literal(value)}) from vault.secrets where name = ${literal(name)};
  if not found then perform vault.create_secret(${literal(value)}, ${literal(name)}); end if;`;

// Kong, the API gateway, as the database container reaches it on the Supabase network.
supabase(
  'db',
  'query',
  '--local',
  `do $$ begin ${secret('project_url', 'http://kong:8000')} ${secret('service_role_key', key)} end $$;`,
);
console.log('Vault: project_url and service_role_key set for the nightly learner profiles.');
