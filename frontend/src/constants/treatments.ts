// =============================================
// Centralized source of truth for treatments,
// patient types, categories, and clinic info.
// Replaces 10+ duplicated maps across the codebase.
// =============================================

export type TreatmentCategory = 'general' | 'wellbeing' | 'personalized' | 'rejuvenation' | 'iv_therapy';

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
  { key: 'wellbeing', label: 'Bem-estar', labelEn: 'Well-being', icon: 'Heart', color: '#14B8A6' },
  { key: 'personalized', label: 'Medicina Personalizada', labelEn: 'Personalized Medicine', icon: 'Brain', color: '#8B5CF6' },
  { key: 'rejuvenation', label: 'Rejuvenescimento', labelEn: 'Rejuvenation', icon: 'Sparkles', color: '#EC4899' },
  { key: 'iv_therapy', label: 'Terapia IV', labelEn: 'IV Therapy', icon: 'Droplets', color: '#3B82F6' },
  { key: 'general', label: 'Geral', labelEn: 'General', icon: 'Stethoscope', color: '#92563E' },
];

// =============================================
// TREATMENT TYPES (all 24: 18 active + 6 legacy)
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
