-- Migration: Add custom_presets and sound_settings JSONB columns to profiles table to support custom focus sessions and sound preferences.
-- Up
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_presets JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sound_settings JSONB DEFAULT '{}'::jsonb;

-- Rollback Strategy:
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS custom_presets;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS sound_settings;
