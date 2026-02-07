-- =============================================
-- Migration 018: Insert new treatment types
-- 11 new treatments found on essencemedicalclinic.com
-- =============================================

-- Personalized Medicine: High Cortisol Management
INSERT INTO treatment_types (key, label_pt, label_en, short_label_pt, short_label_en, description_pt, description_en, category, duration_minutes, is_active, sort_order) VALUES
  ('high_cortisol', 'Gerenciamento de Cortisol Alto', 'High Cortisol Management', 'Cortisol', 'Cortisol', 'Gerenciamento de niveis elevados de cortisol', 'High cortisol level management', 'personalized', 45, true, 23)
ON CONFLICT (key) DO NOTHING;

-- IV Therapy: Iron Infusions + Chelation
INSERT INTO treatment_types (key, label_pt, label_en, short_label_pt, short_label_en, description_pt, description_en, category, duration_minutes, is_active, sort_order) VALUES
  ('iron_infusions', 'Infusao de Ferro', 'Iron Infusions', 'Ferro', 'Iron', 'Infusao intravenosa de ferro', 'Intravenous iron infusion', 'iv_therapy', 60, true, 45),
  ('chelation_therapy', 'Terapia de Quelacao', 'Chelation Therapy', 'Quelacao', 'Chelation', 'Terapia de quelacao para desintoxicacao de metais pesados', 'Chelation therapy for heavy metal detoxification', 'iv_therapy', 90, true, 46)
ON CONFLICT (key) DO NOTHING;

-- Peptide Therapy (8 peptides - new category)
INSERT INTO treatment_types (key, label_pt, label_en, short_label_pt, short_label_en, description_pt, description_en, category, duration_minutes, is_active, sort_order) VALUES
  ('bpc_157', 'BPC-157', 'BPC-157', 'BPC-157', 'BPC-157', 'Peptideo para recuperacao e saude intestinal', 'Peptide for recovery and gut healing', 'peptide_therapy', 30, true, 50),
  ('thymosin_alpha_1', 'Thymosin Alpha-1', 'Thymosin Alpha-1', 'Thymosin', 'Thymosin', 'Peptideo para suporte imunologico', 'Peptide for immune system support', 'peptide_therapy', 30, true, 51),
  ('cjc_1295_ipamorelin', 'CJC-1295/Ipamorelin', 'CJC-1295/Ipamorelin', 'CJC/Ipam.', 'CJC/Ipam.', 'Combo de peptideos para GH e anti-aging', 'Peptide combo for GH release and anti-aging', 'peptide_therapy', 30, true, 52),
  ('pt_141', 'PT-141', 'PT-141', 'PT-141', 'PT-141', 'Peptideo para saude sexual e bem-estar', 'Peptide for sexual wellness', 'peptide_therapy', 30, true, 53),
  ('selank', 'Selank', 'Selank', 'Selank', 'Selank', 'Peptideo para ansiedade e funcao cognitiva', 'Peptide for anxiety and cognitive function', 'peptide_therapy', 30, true, 54),
  ('kpv', 'KPV', 'KPV', 'KPV', 'KPV', 'Peptideo anti-inflamatorio', 'Anti-inflammatory peptide', 'peptide_therapy', 30, true, 55),
  ('dihexa', 'Dihexa', 'Dihexa', 'Dihexa', 'Dihexa', 'Peptideo para neuroprotecao e memoria', 'Peptide for neuroprotection and memory', 'peptide_therapy', 30, true, 56),
  ('mots_c', 'MOTS-c', 'MOTS-c', 'MOTS-c', 'MOTS-c', 'Peptideo para metabolismo e performance fisica', 'Peptide for metabolism and physical performance', 'peptide_therapy', 30, true, 57)
ON CONFLICT (key) DO NOTHING;

-- Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('018', '018_new_treatments_data')
ON CONFLICT (version) DO NOTHING;
