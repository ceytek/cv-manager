-- Migration: Add longlist action types for history tracking
-- Date: 2026-02-01

-- Add longlist_added action type
INSERT INTO action_types (id, code, name_tr, name_en, icon, color, is_system, sort_order, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'longlist_added',
    'Long List''e Eklendi',
    'Added to Long List',
    'list',
    'blue',
    true,
    53,
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- Add longlist_removed action type
INSERT INTO action_types (id, code, name_tr, name_en, icon, color, is_system, sort_order, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'longlist_removed',
    'Long List''ten Çıkarıldı',
    'Removed from Long List',
    'list-x',
    'gray',
    true,
    54,
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;
