import {
  getState,
  setBookingState,
  setCancelState,
  clearState,
  BookingState,
  CancelState,
  ConversationState,
} from './conversationState';
import { MenuOption } from './menuBuilder';

// =============================================
// State Manager — Extends conversationState
// with MenuState for dynamic option mapping
// =============================================

export interface MenuState {
  optionMap: Map<number, MenuOption>;
  handler: string;   // which handler set this menu: 'main', 'services', 'services_category', etc.
  page: number;
  context?: any;     // extra context (e.g., selected category for services)
  createdAt: number;
}

const menuStates = new Map<string, MenuState>();
const MENU_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Stores the current menu state for a JID.
 * This maps numbered options to actions for response handling.
 */
export function setMenuState(
  jid: string,
  handler: string,
  optionMap: Map<number, MenuOption>,
  page: number = 1,
  context?: any
): void {
  menuStates.set(jid, {
    optionMap,
    handler,
    page,
    context,
    createdAt: Date.now(),
  });
}

/**
 * Gets the current menu state for a JID.
 * Returns undefined if expired or not set.
 */
export function getMenuState(jid: string): MenuState | undefined {
  const state = menuStates.get(jid);
  if (!state) return undefined;
  if (Date.now() - state.createdAt > MENU_TTL) {
    menuStates.delete(jid);
    return undefined;
  }
  return state;
}

/**
 * Clears the menu state for a JID.
 */
export function clearMenuState(jid: string): void {
  menuStates.delete(jid);
}

/**
 * Clears ALL state for a JID (conversation + menu).
 */
export function clearAllState(jid: string): void {
  clearState(jid);
  clearMenuState(jid);
}

/**
 * Resolves a numeric input to a MenuOption.
 * Returns null if no menu state or invalid number.
 */
export function resolveMenuOption(jid: string, input: string): MenuOption | null {
  const idx = parseInt(input, 10);
  if (isNaN(idx) || idx < 1) return null;

  const menuState = getMenuState(jid);
  if (!menuState) return null;

  return menuState.optionMap.get(idx) || null;
}

// Re-export existing state functions for convenience
export {
  getState,
  setBookingState,
  setCancelState,
  clearState,
  BookingState,
  CancelState,
  ConversationState,
};
