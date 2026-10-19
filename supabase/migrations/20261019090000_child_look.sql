-- Phase 6: the child's look, a theme and an avatar, chosen by the child (or the parent).
--
-- children.theme_id and children.avatar exist since phase 1; this migration checks them. Themes
-- are the token files of packages/ui/src/theme/themes; avatar parts mirror
-- packages/shared/src/avatar.ts (avatar.test.ts compares them). An avatar is {} until the child
-- chooses one (the app then draws the default one of the profile). Rare parts are earned with a
-- badge: set_child_look checks it (a parent, who may update the child directly, decides alone).

-- The themes the app knows (packages/ui/src/theme/themes; themes.test.ts compares them). Adding a
-- theme: a new migration that replaces this function.
create function private.theme_ids() returns text[]
language sql immutable
set search_path = ''
as $$
  select array['kawaii', 'manga', 'space'];
$$;

-- Every option of every part of an avatar.
create function private.avatar_parts() returns jsonb
language sql immutable
set search_path = ''
as $$
  select '{"skin": ["skin-1", "skin-2", "skin-3", "skin-4", "skin-5", "skin-6"], "hair": ["short", "curly", "long", "bun", "braids", "spiky", "pigtails", "none"], "hairColor": ["black", "dark-brown", "brown", "blond", "red", "blue", "pink", "gold"], "eyes": ["round", "happy", "wink", "glasses"], "outfit": ["tshirt", "hoodie", "dress", "overalls", "sport", "cape", "astronaut"], "outfitColor": ["red", "blue", "green", "yellow", "purple", "orange"]}'::jsonb;
$$;

-- Rare options and the badge that opens each one ("part:option": badge code).
create function private.avatar_locks() returns jsonb
language sql immutable
set search_path = ''
as $$
  select '{"outfit:cape": "streak-7", "outfit:astronaut": "island-1", "hairColor:gold": "combo-10"}'::jsonb;
$$;

-- An avatar names one option of every part, and nothing else.
create function private.valid_avatar(p_avatar jsonb) returns boolean
language sql immutable
set search_path = ''
as $$
  select jsonb_typeof(p_avatar) = 'object'
    and (select array_agg(k order by k) from jsonb_object_keys(p_avatar) k)
      = (select array_agg(k order by k) from jsonb_object_keys(private.avatar_parts()) k)
    and not exists (
      select 1 from jsonb_each(p_avatar) part
      where jsonb_typeof(part.value) <> 'string'
        or not (private.avatar_parts() -> part.key) ? (part.value #>> '{}')
    );
$$;

alter table public.children
  add constraint children_theme_id_check check (theme_id = any (private.theme_ids())),
  add constraint children_avatar_check check (avatar = '{}'::jsonb or private.valid_avatar(avatar));

-- The child's device (or a parent) sets the child's theme and avatar.
create function public.set_child_look(p_child_id uuid, p_theme_id text, p_avatar jsonb)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  locked text;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  if p_theme_id is null or not (p_theme_id = any (private.theme_ids())) then
    raise exception 'invalid_theme' using errcode = 'PT400';
  end if;
  if p_avatar is null or not private.valid_avatar(p_avatar) then
    raise exception 'invalid_avatar' using errcode = 'PT400';
  end if;
  -- A rare option needs its badge.
  select lock.value #>> '{}' into locked
  from jsonb_each(p_avatar) part
  join jsonb_each(private.avatar_locks()) lock
    on lock.key = part.key || ':' || (part.value #>> '{}')
  where not exists (
    select 1 from public.child_badges b
    where b.child_id = p_child_id and b.badge_code = lock.value #>> '{}'
  )
  limit 1;
  if locked is not null then
    raise exception 'avatar_locked' using errcode = 'PT403';
  end if;

  update public.children c set theme_id = p_theme_id, avatar = p_avatar where c.id = p_child_id;
end;
$$;

revoke all on function private.theme_ids() from public;
revoke all on function private.avatar_parts() from public;
revoke all on function private.avatar_locks() from public;
revoke all on function private.valid_avatar(jsonb) from public;
-- The check constraint runs them as the user who writes the child (a parent).
grant execute on function private.theme_ids() to authenticated;
grant execute on function private.avatar_parts() to authenticated;
grant execute on function private.valid_avatar(jsonb) to authenticated;
revoke all on function public.set_child_look(uuid, text, jsonb) from public, anon;
grant execute on function public.set_child_look(uuid, text, jsonb) to authenticated;
