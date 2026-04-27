-- Migration: Add GPT-image-1 (ChatGPT Images 2.0) as a 4th AI image generation model
-- Provider: openai
-- Display name: ChatGPT Image
-- Quality tiers: high ($0.167), medium ($0.042), low ($0.011) per image

-- Expand provider check constraint to include openai
ALTER TABLE ai_models DROP CONSTRAINT IF EXISTS ai_models_provider_check;
ALTER TABLE ai_models ADD CONSTRAINT ai_models_provider_check
  CHECK (provider = ANY (ARRAY['google'::text, 'ideogram'::text, 'openai'::text]));

INSERT INTO ai_models (
  model_id,
  name,
  provider,
  slug,
  description,
  best_for,
  credits_cost,
  display_order,
  is_active
) VALUES (
  'gpt-image-1',
  'ChatGPT Image',
  'openai',
  'chatgpt-image',
  'OpenAI GPT-image-1 — photorealistic, clean compositions with precise instruction following. Supports portrait, landscape, and square formats.',
  'Product shots, photorealistic event posters, clean professional designs with sharp typography',
  8,
  4,
  true
) ON CONFLICT (model_id) DO UPDATE SET
  name         = EXCLUDED.name,
  provider     = EXCLUDED.provider,
  slug         = EXCLUDED.slug,
  description  = EXCLUDED.description,
  best_for     = EXCLUDED.best_for,
  credits_cost = EXCLUDED.credits_cost,
  display_order = EXCLUDED.display_order,
  is_active    = EXCLUDED.is_active;
