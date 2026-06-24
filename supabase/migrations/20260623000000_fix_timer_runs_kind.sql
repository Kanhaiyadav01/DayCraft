-- Migration: Add 'focus' to timer_runs.kind CHECK constraint to support focus timer runs
-- Up
ALTER TABLE public.timer_runs DROP CONSTRAINT IF EXISTS timer_runs_kind_check;
ALTER TABLE public.timer_runs ADD CONSTRAINT timer_runs_kind_check CHECK (kind IN ('stopwatch', 'timer', 'focus'));

-- Update hours_10 and hours_50 achievements to use the 'time' category (measured in seconds) instead of 'focus' (measured in sessions)
UPDATE public.achievements
SET category = 'time', threshold = 36000
WHERE id = 'hours_10';

UPDATE public.achievements
SET category = 'time', threshold = 180000
WHERE id = 'hours_50';

-- Rollback Strategy:
-- ALTER TABLE public.timer_runs DROP CONSTRAINT IF EXISTS timer_runs_kind_check;
-- ALTER TABLE public.timer_runs ADD CONSTRAINT timer_runs_kind_check CHECK (kind IN ('stopwatch', 'timer'));
-- UPDATE public.achievements SET category = 'focus', threshold = 10 WHERE id = 'hours_10';
-- UPDATE public.achievements SET category = 'focus', threshold = 50 WHERE id = 'hours_50';
