-- Canvas-editor variants are free edits (no AI generation).
-- The original constraint requires credits_used > 0, which blocks variant inserts.
-- Relax it to >= 0 so variants can record zero cost without distorting analytics.
ALTER TABLE creatives DROP CONSTRAINT IF EXISTS creatives_credits_used_check;
ALTER TABLE creatives ADD CONSTRAINT creatives_credits_used_check CHECK (credits_used >= 0);
