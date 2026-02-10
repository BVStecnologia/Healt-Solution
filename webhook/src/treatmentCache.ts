import { getClient } from './scheduleManager';
import { Language } from './types';

// =============================================
// Treatment Cache — In-memory cache for treatment_types
// Avoids querying DB on every message
// =============================================

export interface CachedTreatment {
  key: string;
  label_pt: string;
  label_en: string;
  short_label_pt: string;
  short_label_en: string;
  description_pt: string | null;
  description_en: string | null;
  category: string;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
  price: number | null;
  cost: number | null;
}

let cache: CachedTreatment[] = [];
let lastRefresh = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Force-refreshes the cache from DB.
 */
export async function refreshCache(): Promise<void> {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('treatment_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[TreatmentCache] Error refreshing:', error);
      return;
    }

    cache = (data || []).map((row: any) => ({
      key: row.key,
      label_pt: row.label_pt || row.key,
      label_en: row.label_en || row.key,
      short_label_pt: row.short_label_pt || row.label_pt || row.key,
      short_label_en: row.short_label_en || row.label_en || row.key,
      description_pt: row.description_pt || null,
      description_en: row.description_en || null,
      category: row.category || 'general',
      duration_minutes: row.duration_minutes || 30,
      is_active: row.is_active !== false,
      sort_order: row.sort_order || 0,
      price: row.price ?? null,
      cost: row.cost ?? null,
    }));

    lastRefresh = Date.now();
    console.log(`[TreatmentCache] Refreshed: ${cache.length} treatments loaded`);
  } catch (err) {
    console.error('[TreatmentCache] Unexpected error:', err);
  }
}

/**
 * Ensures cache is loaded and not stale.
 */
async function ensureCache(): Promise<void> {
  if (cache.length === 0 || Date.now() - lastRefresh > CACHE_TTL) {
    await refreshCache();
  }
}

/**
 * Returns all active treatments.
 */
export async function getActiveTreatments(): Promise<CachedTreatment[]> {
  await ensureCache();
  return cache.filter(t => t.is_active);
}

/**
 * Returns all treatments (including legacy/inactive).
 */
export async function getAllTreatments(): Promise<CachedTreatment[]> {
  await ensureCache();
  return [...cache];
}

/**
 * Gets the label for a treatment key.
 */
export async function getCachedTreatmentLabel(key: string, lang: Language = 'pt'): Promise<string> {
  await ensureCache();
  const t = cache.find(item => item.key === key);
  if (!t) return key;
  return lang === 'pt' ? t.label_pt : t.label_en;
}

/**
 * Gets the short label for a treatment key.
 */
export async function getCachedTreatmentShortLabel(key: string, lang: Language = 'pt'): Promise<string> {
  await ensureCache();
  const t = cache.find(item => item.key === key);
  if (!t) return key;
  return lang === 'pt' ? t.short_label_pt : t.short_label_en;
}

/**
 * Gets the duration in minutes for a treatment key.
 */
export async function getCachedTreatmentDuration(key: string): Promise<number> {
  await ensureCache();
  const t = cache.find(item => item.key === key);
  return t?.duration_minutes || 30;
}

/**
 * Returns active treatments grouped by category.
 */
export async function getCachedTreatmentsByCategory(): Promise<Map<string, CachedTreatment[]>> {
  await ensureCache();
  const active = cache.filter(t => t.is_active);
  const byCategory = new Map<string, CachedTreatment[]>();

  for (const t of active) {
    const existing = byCategory.get(t.category) || [];
    existing.push(t);
    byCategory.set(t.category, existing);
  }

  return byCategory;
}

/**
 * Category display labels.
 */
const CATEGORY_LABELS: Record<string, Record<Language, string>> = {
  general: { pt: 'Geral', en: 'General' },
  wellbeing: { pt: 'Bem-estar', en: 'Well-being' },
  personalized: { pt: 'Personalizado', en: 'Personalized' },
  rejuvenation: { pt: 'Rejuvenescimento', en: 'Rejuvenation' },
  iv_therapy: { pt: 'Terapia IV', en: 'IV Therapy' },
  peptide_therapy: { pt: 'Terapia Peptídica', en: 'Peptide Therapy' },
};

export function getCategoryLabel(category: string, lang: Language): string {
  return CATEGORY_LABELS[category]?.[lang] || category;
}
