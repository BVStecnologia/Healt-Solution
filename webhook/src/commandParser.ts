import { ParsedCommand, CommandType, Language, BlockPeriod } from './types';

// Command aliases in PT and EN
const COMMAND_MAP: Record<string, { type: CommandType; lang: Language }> = {
  // PT
  'agenda': { type: 'schedule', lang: 'pt' },
  'bloquear': { type: 'block', lang: 'pt' },
  'liberar': { type: 'unblock', lang: 'pt' },
  'pacientes': { type: 'patients', lang: 'pt' },
  'ajuda': { type: 'help', lang: 'pt' },
  // EN
  'schedule': { type: 'schedule', lang: 'en' },
  'block': { type: 'block', lang: 'en' },
  'unblock': { type: 'unblock', lang: 'en' },
  'patients': { type: 'patients', lang: 'en' },
  'help': { type: 'help', lang: 'en' },
};

// Period aliases
const PERIOD_MAP: Record<string, BlockPeriod> = {
  // PT
  'manhã': 'morning',
  'manha': 'morning',
  'tarde': 'afternoon',
  // EN
  'morning': 'morning',
  'afternoon': 'afternoon',
};

const PERIOD_TIMES: Record<string, { start: string; end: string }> = {
  morning: { start: '08:00', end: '12:00' },
  afternoon: { start: '12:00', end: '18:00' },
};

/**
 * Parses a date string in DD/MM or MM/DD format depending on language.
 * Returns a Date object or undefined if invalid.
 */
function parseDate(dateStr: string, lang: Language): Date | undefined {
  const parts = dateStr.split('/');
  if (parts.length !== 2) return undefined;

  const [a, b] = parts.map(Number);
  if (isNaN(a) || isNaN(b)) return undefined;

  const now = new Date();
  const year = now.getFullYear();

  let day: number, month: number;
  if (lang === 'pt') {
    // DD/MM
    day = a;
    month = b;
  } else {
    // MM/DD
    month = a;
    day = b;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;

  const date = new Date(year, month - 1, day);

  // If date is in the past, assume next year
  if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    date.setFullYear(year + 1);
  }

  return date;
}

/**
 * Parses a time range string like "08:00-12:00"
 */
function parseTimeRange(str: string): { start: string; end: string } | undefined {
  const match = str.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
  if (!match) return undefined;
  return { start: match[1], end: match[2] };
}

/**
 * Parses a WhatsApp message into a structured command.
 */
export function parseCommand(message: string): ParsedCommand {
  const raw = message.trim();
  const parts = raw.toLowerCase().split(/\s+/);
  const firstWord = parts[0];

  const commandInfo = COMMAND_MAP[firstWord];
  if (!commandInfo) {
    return { type: 'unknown', language: 'pt', raw };
  }

  const { type, lang } = commandInfo;
  const result: ParsedCommand = { type, language: lang, raw };

  if (type === 'help') {
    return result;
  }

  // Parse date (second argument)
  if (parts.length > 1) {
    const date = parseDate(parts[1], lang);
    if (date) {
      result.date = date;
    }
  }

  // For block/unblock, parse period (third argument)
  if ((type === 'block') && parts.length > 2) {
    const periodArg = parts[2];

    // Check named periods
    const period = PERIOD_MAP[periodArg];
    if (period) {
      result.period = period;
      const times = PERIOD_TIMES[period];
      result.startTime = times.start;
      result.endTime = times.end;
    } else {
      // Try time range (e.g., "08:00-12:00")
      const timeRange = parseTimeRange(parts.slice(2).join(' '));
      if (timeRange) {
        result.period = 'custom';
        result.startTime = timeRange.start;
        result.endTime = timeRange.end;
      }
    }
  }

  // Default period for block is full_day
  if (type === 'block' && !result.period) {
    result.period = 'full_day';
  }

  return result;
}
