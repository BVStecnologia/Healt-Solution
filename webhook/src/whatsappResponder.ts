import { config } from './config';
import { Language } from './types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Sends "typing..." presence indicator via Evolution API.
 */
async function sendTypingPresence(instanceName: string, remoteJid: string): Promise<void> {
  const number = remoteJid.replace('@s.whatsapp.net', '');
  try {
    await fetch(`${config.evolutionApiUrl}/chat/updatePresence/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolutionApiKey,
      },
      body: JSON.stringify({ number, presence: 'composing' }),
    });
  } catch {
    // Ignore - typing indicator is best-effort
  }
}

/**
 * Sends a WhatsApp message via Evolution API.
 * Shows "typing..." indicator and adds a natural delay before sending.
 */
export async function sendMessage(instanceName: string, remoteJid: string, text: string): Promise<boolean> {
  const url = `${config.evolutionApiUrl}/message/sendText/${instanceName}`;

  try {
    // Show "typing..." indicator
    await sendTypingPresence(instanceName, remoteJid);

    // Natural delay: 1-3s based on message length
    const delay = Math.min(1000 + text.length * 8, 3000);
    await sleep(delay);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolutionApiKey,
      },
      body: JSON.stringify({
        number: remoteJid.replace('@s.whatsapp.net', ''),
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Error sending message: ${response.status} - ${body}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

// Appointment type labels (short) - bilingual
export const TYPE_LABELS: Record<string, Record<Language, string>> = {
  // Active types
  initial_consultation: { pt: 'Consulta Inicial', en: 'Initial Consultation' },
  follow_up: { pt: 'Retorno', en: 'Follow-up' },
  functional_medicine: { pt: 'Medicina Funcional', en: 'Functional Medicine' },
  bhrt: { pt: 'BHRT', en: 'BHRT' },
  male_hypertrophy: { pt: 'Hipertrofia Masc.', en: 'Male Hypertrophy' },
  female_hypertrophy: { pt: 'Hipertrofia Fem.', en: 'Female Hypertrophy' },
  insulin_resistance: { pt: 'Resist. Insulina', en: 'Insulin Resistance' },
  chronic_inflammation: { pt: 'Inflam. Crônica', en: 'Chronic Inflammation' },
  thyroid_support: { pt: 'Tireoide', en: 'Thyroid Support' },
  morpheus8: { pt: 'Morpheus8', en: 'Morpheus8' },
  botulinum_toxin: { pt: 'Botox', en: 'Botulinum Toxin' },
  fillers: { pt: 'Preenchimento', en: 'Fillers' },
  skin_boosters: { pt: 'Skin Boosters', en: 'Skin Boosters' },
  iv_protocols: { pt: 'Protocolos IV', en: 'IV Protocols' },
  customized_iv_nutrition: { pt: 'IV Nutrição', en: 'IV Nutrition' },
  nutrient_testing: { pt: 'Teste Nutrientes', en: 'Nutrient Testing' },
  nad_therapy: { pt: 'NAD+', en: 'NAD+ Therapy' },
  vitamin_injections: { pt: 'Vitaminas', en: 'Vitamin Injections' },
  iron_infusions: { pt: 'Infusão Ferro', en: 'Iron Infusions' },
  chelation_therapy: { pt: 'Quelação', en: 'Chelation Therapy' },
  high_cortisol: { pt: 'Cortisol Alto', en: 'High Cortisol' },
  // Peptide Therapy
  bpc_157: { pt: 'BPC-157', en: 'BPC-157' },
  thymosin_alpha_1: { pt: 'Thymosin A1', en: 'Thymosin A1' },
  cjc_1295_ipamorelin: { pt: 'CJC/Ipam.', en: 'CJC/Ipam.' },
  pt_141: { pt: 'PT-141', en: 'PT-141' },
  selank: { pt: 'Selank', en: 'Selank' },
  kpv: { pt: 'KPV', en: 'KPV' },
  dihexa: { pt: 'Dihexa', en: 'Dihexa' },
  mots_c: { pt: 'MOTS-c', en: 'MOTS-c' },
  // Legacy types (for existing records)
  hormone_check: { pt: 'Av. Hormonal', en: 'Hormone Check' },
  lab_review: { pt: 'Rev. Exames', en: 'Lab Review' },
  nutrition: { pt: 'Nutrição', en: 'Nutrition' },
  health_coaching: { pt: 'Coaching', en: 'Coaching' },
  therapy: { pt: 'Terapia', en: 'Therapy' },
  personal_training: { pt: 'Personal', en: 'Personal Training' },
};

export const STATUS_EMOJI: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  checked_in: '📋',
  in_progress: '🔄',
  completed: '✔️',
};

export const WEEKDAY_SHORT: Record<Language, string[]> = {
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export function formatDateShort(date: Date, lang: Language): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const weekday = WEEKDAY_SHORT[lang][date.getDay()];

  if (lang === 'pt') return `${d}/${m} (${weekday})`;
  return `${m}/${d} (${weekday})`;
}

export function getTypeLabel(type: string, lang: Language): string {
  return TYPE_LABELS[type]?.[lang] || type;
}
