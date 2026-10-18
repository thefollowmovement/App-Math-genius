-- Phase 5: the shop. Gems buy companions, accessories and victory effects (and streak freezes,
-- through buy_freeze); never real money. The catalog mirrors packages/shared/src/shop.ts
-- (shop.test.ts compares them); names and icons are in the app (fr.ts). Until the avatar editor
-- (phase 6), the companion and the accessory show on the child's home, the effect at the end of a
-- session. One item of each kind is worn at a time.

create type public.shop_item_kind as enum ('companion', 'accessory', 'effect');

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind public.shop_item_kind not null,
  price_gems integer not null check (price_gems > 0),
  position smallint not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.child_items (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  item_code text not null references public.shop_items (code),
  equipped boolean not null default false,
  bought_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, item_code)
);

create trigger shop_items_updated_at before update on public.shop_items
  for each row execute function private.set_updated_at();
create trigger child_items_updated_at before update on public.child_items
  for each row execute function private.set_updated_at();

alter table public.shop_items enable row level security;
alter table public.child_items enable row level security;

create policy "Everyone signed in reads the shop" on public.shop_items
  for select to authenticated
  using (true);

create policy "Parents and devices read their children's items" on public.child_items
  for select to authenticated
  using (child_id in (select private.accessible_child_ids()));

-- Bought and worn through the functions below; no insert, update or delete policy exists.

insert into public.shop_items (code, kind, price_gems, position) values
  ('kitten', 'companion', 60, 1),
  ('puppy', 'companion', 60, 2),
  ('fox', 'companion', 80, 3),
  ('panda', 'companion', 100, 4),
  ('octopus', 'companion', 120, 5),
  ('unicorn', 'companion', 150, 6),
  ('dragon', 'companion', 200, 7),
  ('bow', 'accessory', 30, 8),
  ('cap', 'accessory', 30, 9),
  ('sunglasses', 'accessory', 40, 10),
  ('top-hat', 'accessory', 60, 11),
  ('crown', 'accessory', 120, 12),
  ('confetti', 'effect', 50, 13),
  ('sparkles', 'effect', 50, 14),
  ('rainbow', 'effect', 80, 15),
  ('fireworks', 'effect', 120, 16);

-- Buys an item for the child with gems, and wears it.
create function public.buy_item(p_child_id uuid, p_item_code text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  item public.shop_items;
  today date;
  current public.progress;
  bought public.child_items;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  select * into item from public.shop_items s where s.code = p_item_code;
  if item.id is null then
    raise exception 'item_not_found' using errcode = 'PT404';
  end if;
  -- One purchase at a time per child.
  perform 1 from public.children c where c.id = p_child_id for update;
  if exists (
    select 1 from public.child_items i where i.child_id = p_child_id and i.item_code = item.code
  ) then
    raise exception 'already_owned' using errcode = 'PT409';
  end if;

  today := private.child_today(p_child_id, now());
  current := private.refresh_progress(p_child_id, today);
  if current.gems < item.price_gems then
    raise exception 'not_enough_gems' using errcode = 'PT409';
  end if;

  update public.child_items i set equipped = false
  from public.shop_items s
  where i.child_id = p_child_id and s.code = i.item_code and s.kind = item.kind and i.equipped;
  insert into public.child_items (child_id, item_code, equipped, bought_at)
  values (p_child_id, item.code, true, now())
  returning * into bought;
  insert into public.gem_transactions (child_id, amount, reason, ref_id, local_date)
  values (p_child_id, -item.price_gems, 'shop', bought.id, today);

  current := private.refresh_progress(p_child_id, today);
  return jsonb_build_object('item_code', item.code, 'total_gems', current.gems);
end;
$$;

-- Wears an item the child owns (taking off the other one of its kind), or takes it off.
create function public.equip_item(p_child_id uuid, p_item_code text, p_equipped boolean)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  owned public.child_items;
begin
  if p_child_id is null or p_child_id not in (select private.accessible_child_ids()) then
    raise exception 'child_not_found' using errcode = 'PT404';
  end if;
  select * into owned from public.child_items i
  where i.child_id = p_child_id and i.item_code = p_item_code
  for update;
  if owned.id is null then
    raise exception 'item_not_owned' using errcode = 'PT404';
  end if;

  if p_equipped then
    update public.child_items i set equipped = false
    from public.shop_items s, public.shop_items mine
    where i.child_id = p_child_id and s.code = i.item_code and mine.code = owned.item_code
      and s.kind = mine.kind and i.id <> owned.id and i.equipped;
  end if;
  update public.child_items i set equipped = p_equipped where i.id = owned.id;
end;
$$;

revoke all on function public.buy_item(uuid, text) from public, anon;
revoke all on function public.equip_item(uuid, text, boolean) from public, anon;
grant execute on function public.buy_item(uuid, text) to authenticated;
grant execute on function public.equip_item(uuid, text, boolean) to authenticated;
