-- Phase 9: the weekly and monthly recaps reach parents as notifications. A new enum value is only
-- usable once committed, hence this migration of its own before *_recaps.sql.
alter type public.notification_kind add value 'weekly_recap';
alter type public.notification_kind add value 'monthly_recap';
