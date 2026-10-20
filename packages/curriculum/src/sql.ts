import { ERROR_TYPES, skills } from '.';

const text = (value: string) => `'${value.replace(/'/g, "''")}'`;

/**
 * SQL that loads the referential into the `skills` and `error_types` tables (generated migrations
 * *_skills.sql). Upserts: codes are stable, so a new version only adds rows or updates their fields.
 */
export function skillsSql(): string {
  return [skillRowsSql(), errorTypesSql()].join('\n');
}

function errorTypesSql(): string {
  const rows = ERROR_TYPES.map((type) => {
    const skillCodes = `array[${type.skills.map(text).join(', ')}]::text[]`;
    return `  (${[text(type.code), text(type.label), skillCodes].join(', ')})`;
  });
  return [
    'insert into public.error_types (code, label, skills)',
    'values',
    rows.join(',\n'),
    'on conflict (code) do update',
    '  set label = excluded.label,',
    '      skills = excluded.skills;',
    '',
  ].join('\n');
}

function skillRowsSql(): string {
  const rows = skills.map((skill) => {
    const prerequisites = `array[${skill.prerequisites.map(text).join(', ')}]::text[]`;
    const automatism = 'automatism' in skill && skill.automatism ? 'true' : 'false';
    const values = [
      text(skill.code),
      text(skill.grade),
      text(skill.domain),
      text(skill.title),
      prerequisites,
      automatism,
      text(skill.programVersion),
    ];
    return `  (${values.join(', ')})`;
  });
  return [
    '-- Generated from packages/curriculum by `pnpm curriculum:sql`: do not edit.',
    'insert into public.skills (code, grade, domain, title, prerequisites, automatism, program_version)',
    'values',
    rows.join(',\n'),
    'on conflict (code) do update',
    '  set grade = excluded.grade,',
    '      domain = excluded.domain,',
    '      title = excluded.title,',
    '      prerequisites = excluded.prerequisites,',
    '      automatism = excluded.automatism,',
    '      program_version = excluded.program_version;',
    '',
  ].join('\n');
}
