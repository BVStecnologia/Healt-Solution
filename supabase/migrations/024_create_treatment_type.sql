-- =============================================
-- Migration 024: Create Treatment Type RPC
-- Allows admin to create new treatment types via UI
-- Handles both: adding enum value + inserting treatment_types row
-- =============================================

CREATE OR REPLACE FUNCTION create_treatment_type(
  p_key TEXT,
  p_label_pt TEXT,
  p_label_en TEXT,
  p_short_label_pt TEXT DEFAULT NULL,
  p_short_label_en TEXT DEFAULT NULL,
  p_description_pt TEXT DEFAULT NULL,
  p_description_en TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'general',
  p_duration_minutes INTEGER DEFAULT 30,
  p_price_usd DECIMAL(10,2) DEFAULT NULL,
  p_cost_usd DECIMAL(10,2) DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can create treatment types
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can create treatment types';
  END IF;

  -- Check key doesn't already exist
  IF EXISTS (SELECT 1 FROM treatment_types WHERE key = p_key) THEN
    RAISE EXCEPTION 'Service with key "%" already exists', p_key;
  END IF;

  -- Add enum value to appointment_type (PostgreSQL 12+ supports this in transactions)
  EXECUTE format('ALTER TYPE appointment_type ADD VALUE IF NOT EXISTS %L', p_key);

  -- Insert treatment type row
  INSERT INTO treatment_types (
    key, label_pt, label_en, short_label_pt, short_label_en,
    description_pt, description_en, category, duration_minutes,
    price_usd, cost_usd, is_active, sort_order
  ) VALUES (
    p_key,
    p_label_pt,
    p_label_en,
    COALESCE(NULLIF(p_short_label_pt, ''), p_label_pt),
    COALESCE(NULLIF(p_short_label_en, ''), p_label_en),
    NULLIF(p_description_pt, ''),
    NULLIF(p_description_en, ''),
    p_category,
    p_duration_minutes,
    p_price_usd,
    p_cost_usd,
    true,
    COALESCE((SELECT MAX(sort_order) FROM treatment_types WHERE category = p_category), 0) + 10
  );
END;
$$;

-- Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('024', 'create_treatment_type')
ON CONFLICT (version) DO NOTHING;
