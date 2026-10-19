-- Phase 6f: gems given back for an item the shop no longer sells (*_companions.sql). In a
-- migration of its own: a new enum value can only be used once it is committed.
alter type public.gem_reason add value 'refund';
