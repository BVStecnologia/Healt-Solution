import { TypeOption, ProviderOption, DateOption, TimeSlotOption } from './types';

export interface BookingState {
  step: 'select_type' | 'select_provider' | 'select_date' | 'select_time' | 'confirm';
  appointmentType?: string;
  providerId?: string;
  providerName?: string;
  date?: Date;
  selectedSlot?: string;  // ISO datetime
  typeOptions?: TypeOption[];
  providerOptions?: ProviderOption[];
  dateOptions?: DateOption[];
  timeOptions?: TimeSlotOption[];
  createdAt: number;
}

// Cancellation flow state
export interface CancelState {
  step: 'select_appointment' | 'confirm_late' | 'enter_reason';
  appointmentId?: string;
  appointmentScheduledAt?: string;
  appointments?: { id: string; label: string; scheduled_at?: string }[];
  createdAt: number;
}

export type ConversationState =
  | { type: 'booking'; data: BookingState }
  | { type: 'cancel'; data: CancelState };

const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const states = new Map<string, ConversationState>();
const timers = new Map<string, NodeJS.Timeout>();

export function getState(jid: string): ConversationState | undefined {
  const state = states.get(jid);
  if (!state) return undefined;

  // Check TTL
  const data = state.type === 'booking' ? state.data : state.data;
  if (Date.now() - data.createdAt > STATE_TTL_MS) {
    clearState(jid);
    return undefined;
  }

  return state;
}

export function setBookingState(jid: string, data: Omit<BookingState, 'createdAt'>): void {
  clearTimer(jid);
  states.set(jid, { type: 'booking', data: { ...data, createdAt: Date.now() } });
  timers.set(jid, setTimeout(() => states.delete(jid), STATE_TTL_MS));
}

export function setCancelState(jid: string, data: Omit<CancelState, 'createdAt'>): void {
  clearTimer(jid);
  states.set(jid, { type: 'cancel', data: { ...data, createdAt: Date.now() } });
  timers.set(jid, setTimeout(() => states.delete(jid), STATE_TTL_MS));
}

export function clearState(jid: string): void {
  clearTimer(jid);
  states.delete(jid);
}

function clearTimer(jid: string): void {
  const timer = timers.get(jid);
  if (timer) {
    clearTimeout(timer);
    timers.delete(jid);
  }
}
