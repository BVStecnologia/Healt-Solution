-- =============================================
-- Migration 026: Insert 17 new treatment types
-- Services from OptiMantra gap analysis
-- =============================================

INSERT INTO treatment_types (key, label_pt, label_en, short_label_pt, short_label_en, description_pt, description_en, category, duration_minutes, is_active, sort_order, price_usd, cost_usd) VALUES
  -- General
  ('inbody', 'Composicao Corporal InBody', 'InBody Composition', 'InBody', 'InBody', 'Analise de composicao corporal com InBody', 'Body composition analysis with InBody', 'general', 10, true, 3, 50.00, NULL),
  ('calorimetry', 'Calorimetria', 'Calorimetry', 'Calorim.', 'Calorim.', 'Teste de calorimetria para metabolismo', 'Calorimetry test for metabolism', 'general', 15, true, 4, 70.00, 20.00),
  ('nutritionist_consult', 'Consulta com Nutricionista', 'Nutritionist Consult', 'Nutric.', 'Nutric.', 'Consulta completa com nutricionista', 'Full consultation with nutritionist', 'general', 60, true, 5, 120.00, NULL),
  ('mid_level_consultation', 'Consulta Mid-Level', 'Mid-Level Consultation', 'Mid-Level', 'Mid-Level', 'Consulta com profissional mid-level', 'Consultation with mid-level provider', 'general', 45, true, 6, 200.00, NULL),
  -- Well-being
  ('weight_loss_injection', 'Injecao para Perda de Peso', 'Weight Loss Injection', 'Weight Loss', 'Weight Loss', 'Injecao para auxilio na perda de peso', 'Weight loss injection', 'wellbeing', 10, true, 14, 75.00, NULL),
  ('testosterone_injection', 'Injecao de Testosterona', 'Testosterone Injection', 'Testo. Inj.', 'Testo. Inj.', 'Injecao de testosterona', 'Testosterone injection', 'wellbeing', 10, true, 15, 25.00, NULL),
  ('nandrolone_injection', 'Injecao de Nandrolona', 'Nandrolone Injection', 'Nandrolona', 'Nandrolone', 'Injecao de nandrolona', 'Nandrolone injection', 'wellbeing', 10, true, 16, 30.00, NULL),
  ('tirzepatide_2_5mg', 'Tirzepatide 2.5mg', 'Tirzepatide 2.5mg', 'Tirz. 2.5', 'Tirz. 2.5', 'Tirzepatide dose 2.5mg', 'Tirzepatide 2.5mg dose', 'wellbeing', 5, true, 17, 300.00, 50.00),
  ('tirzepatide_5mg', 'Tirzepatide 5mg', 'Tirzepatide 5mg', 'Tirz. 5', 'Tirz. 5', 'Tirzepatide dose 5mg', 'Tirzepatide 5mg dose', 'wellbeing', 5, true, 18, 350.00, 100.00),
  ('tirzepatide_7_5mg', 'Tirzepatide 7.5mg', 'Tirzepatide 7.5mg', 'Tirz. 7.5', 'Tirz. 7.5', 'Tirzepatide dose 7.5mg', 'Tirzepatide 7.5mg dose', 'wellbeing', 5, true, 19, 375.00, 130.00),
  -- Personalized Medicine
  ('male_pellet', 'Insercao de Pellet Masculino', 'Male Pellet Insertion', 'Pellet Masc.', 'Male Pellet', 'Insercao de pellet hormonal masculino', 'Male hormone pellet insertion', 'personalized', 30, true, 24, 850.00, 150.00),
  ('female_pellet', 'Insercao de Pellet Feminino', 'Female Pellet Insertion', 'Pellet Fem.', 'Female Pellet', 'Insercao de pellet hormonal feminino', 'Female hormone pellet insertion', 'personalized', 30, true, 25, 450.00, 75.00),
  -- IV Therapy
  ('high_dose_vitamin_c', 'Vitamina C Alta Dose', 'High Dose Vitamin C', 'Vit. C HD', 'Vit. C HD', 'Infusao de vitamina C em alta dose', 'High dose vitamin C infusion', 'iv_therapy', 45, true, 47, 220.00, NULL),
  ('inflammation_iv', 'IV Anti-Inflamatorio', 'Inflammation IV', 'Inflam. IV', 'Inflam. IV', 'Protocolo IV anti-inflamatorio', 'Anti-inflammation IV protocol', 'iv_therapy', 60, true, 48, 220.00, 50.00),
  ('metabolic_iv', 'IV Metabolico', 'Metabolic IV', 'Metab. IV', 'Metab. IV', 'Protocolo IV para suporte metabolico', 'Metabolic support IV protocol', 'iv_therapy', 60, true, 49, 220.00, 50.00),
  ('homocysteine_iv', 'IV Homocisteina', 'Homocysteine Management IV', 'Homocist. IV', 'Homocyst. IV', 'Protocolo IV para gerenciamento de homocisteina', 'Homocysteine management IV protocol', 'iv_therapy', 60, true, 50, 220.00, 50.00),
  ('insulin_resistance_iv', 'IV Resistencia a Insulina', 'Insulin Resistance IV', 'Insul. IV', 'Insul. IV', 'Protocolo IV para resistencia a insulina', 'Insulin resistance IV protocol', 'iv_therapy', 60, true, 51, 220.00, 100.00)
ON CONFLICT (key) DO NOTHING;

-- Record migration
INSERT INTO schema_migrations (version, name)
VALUES ('026', '026_add_services_data')
ON CONFLICT (version) DO NOTHING;
