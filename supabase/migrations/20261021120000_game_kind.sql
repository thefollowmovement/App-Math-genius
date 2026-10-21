-- Phase 9b: a mini-game round is a session of its own kind, and its gems have their own reason.
-- Values of an enum can only be used once committed: they come in this migration of their own,
-- before *_mini_games.sql uses them.

alter type public.session_kind add value 'game';
alter type public.gem_reason add value 'game';
