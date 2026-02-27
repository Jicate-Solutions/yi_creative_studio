-- Migration: Add Nano Banana 2 (gemini-3.1-flash-image-preview) to ai_models
-- Date: 2026-02-27
--
-- New capabilities vs Nano Banana (2.5-flash):
--   • Resolutions: 512px, 1K, 2K, 4K (vs 1K only)
--   • Thinking mode: minimal (default) / High (quality)
--   • Google Image Search grounding (exclusive)
--   • Ultra aspect ratios: 8:1, 1:8, 4:1, 1:4
--   • 13% cheaper per image (1120 tokens vs 1290 tokens at 1K)
--   • 14 reference images (vs 3)
--
-- Display order: 2 (sits between Nano Banana at 1 and Nano Banana Pro at 3)

DO $$
BEGIN
  -- Only insert if the model doesn't already exist (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM ai_models WHERE model_id = 'gemini-3.1-flash-image-preview'
  ) THEN
    INSERT INTO ai_models (
      name,
      slug,
      model_id,
      provider,
      description,
      credits_cost,
      best_for,
      avg_generation_time_seconds,
      display_order,
      is_active
    ) VALUES (
      'Nano Banana 2',
      'nano-banana-2',
      'gemini-3.1-flash-image-preview',
      'google',
      'Gemini 3.1 Flash Image — faster, cheaper, and smarter than Nano Banana. Supports 4K resolution, ultra aspect ratios (8:1, 1:8, 4:1, 1:4), Google Image Search grounding, and Quality vs Speed thinking mode.',
      2,
      'High-quality posters, ultra-wide banners, search-grounded designs',
      25,
      2,
      true
    );
    RAISE NOTICE 'Inserted Nano Banana 2 (gemini-3.1-flash-image-preview) into ai_models';
  ELSE
    RAISE NOTICE 'Nano Banana 2 (gemini-3.1-flash-image-preview) already exists in ai_models, skipping';
  END IF;
END $$;
