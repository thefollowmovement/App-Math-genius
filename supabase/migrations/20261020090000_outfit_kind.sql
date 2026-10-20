-- Phase 6g: the shop sells outfits (*_outfits.sql). In a migration of its own: a new enum value
-- can only be used once it is committed.
alter type public.shop_item_kind add value 'outfit' before 'accessory';
