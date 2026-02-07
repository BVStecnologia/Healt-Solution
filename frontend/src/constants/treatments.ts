// =============================================
// Centralized source of truth for treatments,
// patient types, categories, and clinic info.
// Replaces 10+ duplicated maps across the codebase.
// =============================================

export type TreatmentCategory = 'general' | 'wellbeing' | 'personalized' | 'rejuvenation' | 'iv_therapy' | 'peptide_therapy';

export interface TreatmentType {
  key: string;
  label: string;
  labelEn: string;
  shortLabel: string;
  shortLabelEn: string;
  description: string;
  descriptionEn: string;
  duration: number;
  category: TreatmentCategory;
  active: boolean;
}

export interface CategoryInfo {
  key: TreatmentCategory;
  label: string;
  labelEn: string;
  icon: string;
  color: string;
}

export interface PatientTypeInfo {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  active: boolean;
}

// =============================================
// CATEGORIES
// =============================================

export const CATEGORIES: CategoryInfo[] = [
  { key: 'wellbeing', label: 'Bem-estar', labelEn: 'Well-being', icon: 'Heart', color: '#B48F7A' },
  { key: 'personalized', label: 'Medicina Personalizada', labelEn: 'Personalized Medicine', icon: 'Brain', color: '#92563E' },
  { key: 'rejuvenation', label: 'Rejuvenescimento', labelEn: 'Rejuvenation', icon: 'Sparkles', color: '#C4836A' },
  { key: 'iv_therapy', label: 'Terapia IV', labelEn: 'IV Therapy', icon: 'Droplets', color: '#B48F7A' },
  { key: 'peptide_therapy', label: 'Terapia de Peptideos', labelEn: 'Peptide Therapy', icon: 'Dna', color: '#D4A574' },
  { key: 'general', label: 'Geral', labelEn: 'General', icon: 'Stethoscope', color: '#7A6355' },
];

// =============================================
// TREATMENT TYPES (all 35: 29 active + 6 legacy)
// =============================================

export const TREATMENT_TYPES: TreatmentType[] = [
  // General
  {
    key: 'initial_consultation', label: 'Consulta Inicial', labelEn: 'Initial Consultation',
    shortLabel: 'Inicial', shortLabelEn: 'Initial',
    description: 'Primeira consulta com o medico', descriptionEn: 'First consultation with the doctor',
    duration: 60, category: 'general', active: true,
  },
  {
    key: 'follow_up', label: 'Retorno', labelEn: 'Follow-up',
    shortLabel: 'Retorno', shortLabelEn: 'Follow-up',
    description: 'Acompanhamento de tratamento', descriptionEn: 'Treatment follow-up',
    duration: 30, category: 'general', active: true,
  },
  // Well-being
  {
    key: 'functional_medicine', label: 'Medicina Funcional', labelEn: 'Functional Medicine',
    shortLabel: 'Funcional', shortLabelEn: 'Functional',
    description: 'Medicina funcional personalizada', descriptionEn: 'Personalized functional medicine',
    duration: 60, category: 'wellbeing', active: true,
  },
  {
    key: 'bhrt', label: 'Terapia Hormonal Bioidentica', labelEn: 'Bio-Identical Hormone Therapy',
    shortLabel: 'BHRT', shortLabelEn: 'BHRT',
    description: 'Reposicao hormonal bioidentica', descriptionEn: 'Bio-identical hormone replacement therapy',
    duration: 45, category: 'wellbeing', active: true,
  },
  {
    key: 'male_hypertrophy', label: 'Hipertrofia Masculina', labelEn: 'Male Hypertrophy Protocol',
    shortLabel: 'Hipert. Masc.', shortLabelEn: 'Male Hyper.',
    description: 'Protocolo de hipertrofia masculina', descriptionEn: 'Male hypertrophy protocol',
    duration: 45, category: 'wellbeing', active: true,
  },
  {
    key: 'female_hypertrophy', label: 'Hipertrofia Feminina', labelEn: 'Female Hypertrophy Protocol',
    shortLabel: 'Hipert. Fem.', shortLabelEn: 'Female Hyper.',
    description: 'Protocolo de hipertrofia feminina', descriptionEn: 'Female hypertrophy protocol',
    duration: 45, category: 'wellbeing', active: true,
  },
  // Personalized Medicine
  {
    key: 'insulin_resistance', label: 'Resistencia a Insulina', labelEn: 'Insulin Resistance Management',
    shortLabel: 'Insulina', shortLabelEn: 'Insulin',
    description: 'Gerenciamento de resistencia a insulina', descriptionEn: 'Insulin resistance management',
    duration: 45, category: 'personalized', active: true,
  },
  {
    key: 'chronic_inflammation', label: 'Inflamacao Cronica', labelEn: 'Chronic Inflammation Management',
    shortLabel: 'Inflamacao', shortLabelEn: 'Inflammation',
    description: 'Gerenciamento de inflamacao cronica', descriptionEn: 'Chronic inflammation management',
    duration: 45, category: 'personalized', active: true,
  },
  {
    key: 'thyroid_support', label: 'Suporte de Tireoide', labelEn: 'Thyroid Support',
    shortLabel: 'Tireoide', shortLabelEn: 'Thyroid',
    description: 'Suporte e otimizacao tireoidiana', descriptionEn: 'Thyroid support and optimization',
    duration: 45, category: 'personalized', active: true,
  },
  {
    key: 'high_cortisol', label: 'Gerenciamento de Cortisol Alto', labelEn: 'High Cortisol Management',
    shortLabel: 'Cortisol', shortLabelEn: 'Cortisol',
    description: 'Gerenciamento de niveis elevados de cortisol', descriptionEn: 'High cortisol level management',
    duration: 45, category: 'personalized', active: true,
  },
  // Rejuvenation
  {
    key: 'morpheus8', label: 'Morpheus8', labelEn: 'Morpheus8',
    shortLabel: 'Morpheus8', shortLabelEn: 'Morpheus8',
    description: 'Estimulacao de colageno com Morpheus8', descriptionEn: 'Collagen stimulation with Morpheus8',
    duration: 60, category: 'rejuvenation', active: true,
  },
  {
    key: 'botulinum_toxin', label: 'Toxina Botulinica', labelEn: 'Botulinum Toxin',
    shortLabel: 'Botox', shortLabelEn: 'Botox',
    description: 'Aplicacao de toxina botulinica', descriptionEn: 'Botulinum toxin application',
    duration: 30, category: 'rejuvenation', active: true,
  },
  {
    key: 'fillers', label: 'Preenchimento', labelEn: 'Fillers',
    shortLabel: 'Preenchi.', shortLabelEn: 'Fillers',
    description: 'Preenchimento dermico com acido hialuronico', descriptionEn: 'Dermal fillers with hyaluronic acid',
    duration: 45, category: 'rejuvenation', active: true,
  },
  {
    key: 'skin_boosters', label: 'Skin Boosters', labelEn: 'Skin Boosters',
    shortLabel: 'Skin Boost', shortLabelEn: 'Skin Boost',
    description: 'Hidratacao profunda da pele', descriptionEn: 'Deep skin hydration treatment',
    duration: 30, category: 'rejuvenation', active: true,
  },
  // IV Therapy
  {
    key: 'iv_protocols', label: 'Protocolos IV', labelEn: 'IV Protocols',
    shortLabel: 'IV Proto.', shortLabelEn: 'IV Proto.',
    description: 'Protocolos de infusao intravenosa', descriptionEn: 'Intravenous infusion protocols',
    duration: 60, category: 'iv_therapy', active: true,
  },
  {
    key: 'customized_iv_nutrition', label: 'Nutricao IV Personalizada', labelEn: 'Customized IV Nutrition',
    shortLabel: 'IV Nutri.', shortLabelEn: 'IV Nutri.',
    description: 'Nutricao intravenosa personalizada', descriptionEn: 'Customized intravenous nutrition',
    duration: 60, category: 'iv_therapy', active: true,
  },
  {
    key: 'nutrient_testing', label: 'Teste de Nutrientes', labelEn: 'Nutrient Testing',
    shortLabel: 'Nutrientes', shortLabelEn: 'Nutrients',
    description: 'Teste de micronutrientes', descriptionEn: 'Micronutrient testing',
    duration: 30, category: 'iv_therapy', active: true,
  },
  {
    key: 'nad_therapy', label: 'Terapia NAD+', labelEn: 'NAD+ Therapy',
    shortLabel: 'NAD+', shortLabelEn: 'NAD+',
    description: 'Infusao de NAD+ para energia celular', descriptionEn: 'NAD+ infusion for cellular energy',
    duration: 90, category: 'iv_therapy', active: true,
  },
  {
    key: 'vitamin_injections', label: 'Injecoes de Vitaminas', labelEn: 'Vitamin Injections',
    shortLabel: 'Vitaminas', shortLabelEn: 'Vitamins',
    description: 'Injecoes intramusculares de vitaminas', descriptionEn: 'Intramuscular vitamin injections',
    duration: 20, category: 'iv_therapy', active: true,
  },
  {
    key: 'iron_infusions', label: 'Infusao de Ferro', labelEn: 'Iron Infusions',
    shortLabel: 'Ferro', shortLabelEn: 'Iron',
    description: 'Infusao intravenosa de ferro', descriptionEn: 'Intravenous iron infusion',
    duration: 60, category: 'iv_therapy', active: true,
  },
  {
    key: 'chelation_therapy', label: 'Terapia de Quelacao', labelEn: 'Chelation Therapy',
    shortLabel: 'Quelacao', shortLabelEn: 'Chelation',
    description: 'Terapia de quelacao para desintoxicacao de metais pesados', descriptionEn: 'Chelation therapy for heavy metal detoxification',
    duration: 90, category: 'iv_therapy', active: true,
  },
  // Peptide Therapy
  {
    key: 'bpc_157', label: 'BPC-157', labelEn: 'BPC-157',
    shortLabel: 'BPC-157', shortLabelEn: 'BPC-157',
    description: 'Peptideo para recuperacao e saude intestinal', descriptionEn: 'Peptide for recovery and gut healing',
    duration: 30, category: 'peptide_therapy', active: true,
  },
  {
    key: 'thymosin_alpha_1', label: 'Thymosin Alpha-1', labelEn: 'Thymosin Alpha-1',
    shortLabel: 'Thymosin', shortLabelEn: 'Thymosin',
    description: 'Peptideo para suporte imunologico', descriptionEn: 'Peptide for immune system support',
    duration: 30, category: 'peptide_therapy', active: true,
  },
  {
    key: 'cjc_1295_ipamorelin', label: 'CJC-1295/Ipamorelin', labelEn: 'CJC-1295/Ipamorelin',
    shortLabel: 'CJC/Ipam.', shortLabelEn: 'CJC/Ipam.',
    description: 'Combo de peptideos para GH e anti-aging', descriptionEn: 'Peptide combo for GH release and anti-aging',
    duration: 30, category: 'peptide_therapy', active: true,
  },
  {
    key: 'pt_141', label: 'PT-141', labelEn: 'PT-141',
    shortLabel: 'PT-141', shortLabelEn: 'PT-141',
    description: 'Peptideo para saude sexual e bem-estar', descriptionEn: 'Peptide for sexual wellness',
    duration: 30, category: 'peptide_therapy', active: true,
  },
  {
    key: 'selank', label: 'Selank', labelEn: 'Selank',
    shortLabel: 'Selank', shortLabelEn: 'Selank',
    description: 'Peptideo para ansiedade e funcao cognitiva', descriptionEn: 'Peptide for anxiety and cognitive function',
    duration: 30, category: 'peptide_therapy', active: true,
  },
  {
    key: 'kpv', label: 'KPV', labelEn: 'KPV',
    shortLabel: 'KPV', shortLabelEn: 'KPV',
    description: 'Peptideo anti-inflamatorio', descriptionEn: 'Anti-inflammatory peptide',
    duration: 30, category: 'peptide_therapy', active: true,
  },
  {
    key: 'dihexa', label: 'Dihexa', labelEn: 'Dihexa',
    shortLabel: 'Dihexa', shortLabelEn: 'Dihexa',
    description: 'Peptideo para neuroprotecao e memoria', descriptionEn: 'Peptide for neuroprotection and memory',
    duration: 30, category: 'peptide_therapy', active: true,
  },
  {
    key: 'mots_c', label: 'MOTS-c', labelEn: 'MOTS-c',
    shortLabel: 'MOTS-c', shortLabelEn: 'MOTS-c',
    description: 'Peptideo para metabolismo e performance fisica', descriptionEn: 'Peptide for metabolism and physical performance',
    duration: 30, category: 'peptide_therapy', active: true,
  },
  // Legacy types (inactive, kept for backward compatibility)
  {
    key: 'hormone_check', label: 'Avaliacao Hormonal', labelEn: 'Hormone Check',
    shortLabel: 'Hormonal', shortLabelEn: 'Hormone',
    description: 'Verificacao de niveis hormonais', descriptionEn: 'Hormone level check',
    duration: 45, category: 'general', active: false,
  },
  {
    key: 'lab_review', label: 'Revisao de Exames', labelEn: 'Lab Review',
    shortLabel: 'Exames', shortLabelEn: 'Lab Review',
    description: 'Analise de resultados laboratoriais', descriptionEn: 'Laboratory results analysis',
    duration: 20, category: 'general', active: false,
  },
  {
    key: 'nutrition', label: 'Nutricao', labelEn: 'Nutrition',
    shortLabel: 'Nutricao', shortLabelEn: 'Nutrition',
    description: 'Consulta com nutricionista', descriptionEn: 'Nutrition consultation',
    duration: 45, category: 'general', active: false,
  },
  {
    key: 'health_coaching', label: 'Health Coaching', labelEn: 'Health Coaching',
    shortLabel: 'Coaching', shortLabelEn: 'Coaching',
    description: 'Sessao de coaching de saude', descriptionEn: 'Health coaching session',
    duration: 30, category: 'general', active: false,
  },
  {
    key: 'therapy', label: 'Terapia', labelEn: 'Therapy',
    shortLabel: 'Terapia', shortLabelEn: 'Therapy',
    description: 'Sessao de terapia', descriptionEn: 'Therapy session',
    duration: 50, category: 'general', active: false,
  },
  {
    key: 'personal_training', label: 'Personal Training', labelEn: 'Personal Training',
    shortLabel: 'Personal', shortLabelEn: 'Personal',
    description: 'Sessao de personal training', descriptionEn: 'Personal training session',
    duration: 60, category: 'general', active: false,
  },
];

// =============================================
// DERIVED DATA
// =============================================

export const ACTIVE_TREATMENTS = TREATMENT_TYPES.filter(t => t.active);

// =============================================
// HELPER FUNCTIONS
// =============================================

export function getTreatmentLabel(key: string, lang: 'pt' | 'en' = 'pt'): string {
  const found = TREATMENT_TYPES.find(t => t.key === key);
  if (!found) return key;
  return lang === 'en' ? found.labelEn : found.label;
}

export function getTreatmentShortLabel(key: string, lang: 'pt' | 'en' = 'pt'): string {
  const found = TREATMENT_TYPES.find(t => t.key === key);
  if (!found) return key;
  return lang === 'en' ? found.shortLabelEn : found.shortLabel;
}

export function getTreatmentDuration(key: string): number {
  const found = TREATMENT_TYPES.find(t => t.key === key);
  return found?.duration ?? 30;
}

export function getTreatmentsByCategory(): { category: CategoryInfo; treatments: TreatmentType[] }[] {
  return CATEGORIES.map(cat => ({
    category: cat,
    treatments: ACTIVE_TREATMENTS.filter(t => t.category === cat.key),
  })).filter(g => g.treatments.length > 0);
}

export function getCategoryInfo(key: TreatmentCategory): CategoryInfo | undefined {
  return CATEGORIES.find(c => c.key === key);
}

export function getTreatmentCategory(treatmentKey: string): CategoryInfo | undefined {
  const treatment = TREATMENT_TYPES.find(t => t.key === treatmentKey);
  if (!treatment) return undefined;
  return getCategoryInfo(treatment.category);
}

// =============================================
// PATIENT TYPES
// =============================================

export const PATIENT_TYPES: PatientTypeInfo[] = [
  // Active types
  { key: 'new', label: 'Novo Paciente', color: '#10B981', bgColor: '#D1FAE5', icon: 'Sparkles', active: true },
  { key: 'wellness', label: 'Bem-estar', color: '#14B8A6', bgColor: '#CCFBF1', icon: 'Heart', active: true },
  { key: 'bhrt', label: 'BHRT', color: '#8B5CF6', bgColor: '#EDE9FE', icon: 'Activity', active: true },
  { key: 'rejuvenation', label: 'Rejuvenescimento', color: '#EC4899', bgColor: '#FCE7F3', icon: 'Sparkles', active: true },
  { key: 'iv_therapy', label: 'Terapia IV', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'Droplets', active: true },
  { key: 'vip', label: 'VIP', color: '#D4AF37', bgColor: '#FEF9C3', icon: 'Crown', active: true },
  // Legacy types (hidden from dropdowns, shown for existing records)
  { key: 'general', label: 'Geral', color: '#8B7355', bgColor: '#F5F0EB', icon: 'User', active: false },
  { key: 'trt', label: 'TRT', color: '#92563E', bgColor: '#FDF2E9', icon: 'Activity', active: false },
  { key: 'hormone', label: 'Hormonal', color: '#C77D8E', bgColor: '#FDF2F8', icon: 'Activity', active: false },
];

export const ACTIVE_PATIENT_TYPES = PATIENT_TYPES.filter(t => t.active);

export function getPatientTypeLabel(key: string): string {
  const found = PATIENT_TYPES.find(t => t.key === key);
  return found?.label ?? key;
}

export function getPatientTypeColor(key: string): string {
  const found = PATIENT_TYPES.find(t => t.key === key);
  return found?.color ?? '#8B7355';
}

export function getPatientTypeBgColor(key: string): string {
  const found = PATIENT_TYPES.find(t => t.key === key);
  return found?.bgColor ?? '#F5F0EB';
}

export function getPatientTypeIcon(key: string): string {
  const found = PATIENT_TYPES.find(t => t.key === key);
  return found?.icon ?? 'User';
}

// =============================================
// CLINIC INFO
// =============================================

export const CLINIC_INFO = {
  name: 'Essence Medical Clinic',
  address: '2000 NE 44th ST Suite 101B',
  city: 'Oakland Park',
  state: 'FL',
  zip: '33308',
  country: 'US',
  phone: '+1-954-756-2565',
  email: 'team@essencemedicalclinic.com',
  website: 'https://essencemedicalclinic.com',
  hours: {
    weekdays: { open: '10:00', close: '18:00', label: 'Mon-Fri: 10 AM - 6 PM' },
    saturday: { open: '11:00', close: '15:00', label: 'Sat: 11 AM - 3 PM (2x/month)' },
    sunday: { open: null, close: null, label: 'Sun: Closed' },
  },
  leadProvider: 'Dr. Rosane Nunes',
  instagram: '@essencemedicalclinic',
};
