// Evolution API webhook payload
export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      remoteJidAlt?: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
}

// Parsed command from WhatsApp message
export type CommandType = 'schedule' | 'block' | 'unblock' | 'patients' | 'help' | 'unknown';
export type Language = 'pt' | 'en';
export type BlockPeriod = 'full_day' | 'morning' | 'afternoon' | 'custom';

export interface ParsedCommand {
  type: CommandType;
  language: Language;
  date?: Date;
  period?: BlockPeriod;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  raw: string;
}

// Provider info from DB
export interface ProviderInfo {
  providerId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: 'pt' | 'en';
}

// Appointment conflict info
export interface ConflictInfo {
  id: string;
  scheduled_at: string;
  type: string;
  status: string;
  patient_name: string;
}

// Block creation result
export interface BlockResult {
  block: {
    id: string;
    provider_id: string;
    block_date: string;
    start_time: string | null;
    end_time: string | null;
    reason: string | null;
    created_via: string;
  };
  conflicts: ConflictInfo[];
}

// Schedule entry for agenda view
export interface ScheduleEntry {
  time: string;
  patientName: string;
  type: string;
  status: string;
}
