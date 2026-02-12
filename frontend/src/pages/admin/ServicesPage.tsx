import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
  DollarSign, Search, Clock, Tag, Package, Plus,
  TrendingUp, X, Check, AlertCircle, Heart, Brain,
  Sparkles, Droplets, Stethoscope, Dna, ChevronDown, ChevronRight,
  Percent, ArrowUpRight, Eye, EyeOff, ChevronsUpDown,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { theme } from '../../styles/GlobalStyle';
import { supabase, callRPC } from '../../lib/supabaseClient';
import { CATEGORIES } from '../../constants/treatments';

// ============================================
// TYPES
// ============================================
interface TreatmentTypeRow {
  key: string;
  label_pt: string;
  label_en: string;
  short_label_pt: string;
  short_label_en: string;
  description_pt: string | null;
  description_en: string | null;
  category: string;
  duration_minutes: number;
  price_usd: number | null;
  cost_usd: number | null;
  is_active: boolean;
  sort_order: number;
}

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// ============================================
// STYLED COMPONENTS
// ============================================
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 32px;
  animation: ${fadeInUp} 0.5s ease;
`;

const HeaderInfo = styled.div`
  h1 {
    font-family: ${theme.typography.fontFamilyHeading};
    font-size: 28px;
    font-weight: 700;
    color: ${theme.colors.text};
    margin: 0 0 4px;
    letter-spacing: -0.5px;
  }
  p {
    font-size: 14px;
    color: ${theme.colors.textSecondary};
    margin: 0;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
  animation: ${fadeInUp} 0.5s ease 0.1s both;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div<{ $color: string }>`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: ${props => props.$color};
    border-radius: 3px 0 0 3px;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: ${props => props.$color}14;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$color};
    flex-shrink: 0;
  }

  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: ${theme.colors.text};
      font-family: ${theme.typography.fontFamilyHeading};
    }
    .stat-label {
      font-size: 12px;
      color: ${theme.colors.textSecondary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.5s ease 0.15s both;
`;

const SearchInput = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;

  svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: ${theme.colors.textMuted};
    width: 18px;
    height: 18px;
  }

  input {
    width: 100%;
    padding: 12px 14px 12px 42px;
    border: 1px solid ${theme.colors.border};
    border-radius: 12px;
    background: ${theme.colors.surface};
    font-size: 14px;
    color: ${theme.colors.text};
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;

    &::placeholder {
      color: ${theme.colors.textMuted};
    }
    &:focus {
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 3px ${theme.colors.primary}15;
    }
  }
`;

const CategoryFilter = styled.div`
  position: relative;

  select {
    appearance: none;
    padding: 12px 36px 12px 14px;
    border: 1px solid ${theme.colors.border};
    border-radius: 12px;
    background: ${theme.colors.surface};
    font-size: 14px;
    color: ${theme.colors.text};
    cursor: pointer;
    outline: none;
    min-width: 180px;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus {
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 3px ${theme.colors.primary}15;
    }
  }

  svg {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${theme.colors.textMuted};
    width: 16px;
    height: 16px;
    pointer-events: none;
  }
`;

const InactiveToggle = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid ${props => props.$active ? theme.colors.primary + '40' : theme.colors.border};
  border-radius: 12px;
  background: ${props => props.$active ? theme.colors.primary + '0A' : theme.colors.surface};
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  svg { width: 16px; height: 16px; }

  &:hover {
    border-color: ${theme.colors.primary}60;
    background: ${theme.colors.primary}0A;
  }
`;

const TableContainer = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: 16px;
  overflow: hidden;
  animation: ${fadeInUp} 0.5s ease 0.2s both;
`;

const CategoryHeaderRow = styled.div<{ $color: string; $expanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: linear-gradient(135deg, ${props => props.$color}0C, ${props => props.$color}06);
  border-bottom: 1px solid ${theme.colors.border};
  border-left: 3px solid ${props => props.$color};
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;

  &:hover {
    background: linear-gradient(135deg, ${props => props.$color}14, ${props => props.$color}0A);
  }

  .cat-chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: ${props => props.$color};
    transition: transform 0.25s ease;
    transform: rotate(${props => props.$expanded ? '90deg' : '0deg'});
    svg { width: 16px; height: 16px; }
  }

  .cat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: ${props => props.$color}18;
    color: ${props => props.$color};
    svg { width: 15px; height: 15px; }
  }

  .cat-label {
    font-weight: 600;
    font-size: 13px;
    color: ${props => props.$color};
    letter-spacing: 0.3px;
  }

  .cat-count {
    font-size: 11px;
    font-weight: 500;
    color: ${props => props.$color}99;
    background: ${props => props.$color}12;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .cat-range {
    margin-left: auto;
    font-size: 12px;
    color: ${theme.colors.textSecondary};
    font-weight: 500;
  }
`;

const AccordionContent = styled.div`
  animation: ${fadeInUp} 0.25s ease;
`;

const ExpandAllButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  background: ${theme.colors.surface};
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  svg { width: 16px; height: 16px; }

  &:hover {
    border-color: ${theme.colors.primary}60;
    background: ${theme.colors.primary}0A;
    color: ${theme.colors.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 12px 24px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;
  background: ${theme.colors.background};
`;

const Tr = styled.tr<{ $inactive?: boolean }>`
  cursor: pointer;
  transition: background 0.15s ease;
  ${props => props.$inactive && css`opacity: 0.55;`}

  &:not(:last-child) td {
    border-bottom: 1px solid ${theme.colors.borderLight};
  }

  &:hover {
    background: ${theme.colors.primary}06;
  }
`;

const Td = styled.td`
  padding: 16px 24px;
  font-size: 14px;
  color: ${theme.colors.text};
  vertical-align: middle;
`;

const ServiceText = styled.div`
  .service-name {
    font-weight: 600;
    font-size: 14px;
    color: ${theme.colors.text};
    margin-bottom: 1px;
  }
  .service-desc {
    font-size: 12px;
    color: ${theme.colors.textMuted};
    max-width: 300px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const DurationChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.background};
  padding: 5px 10px;
  border-radius: 8px;
  font-weight: 500;

  svg { width: 13px; height: 13px; opacity: 0.6; }
`;

const PriceDisplay = styled.div<{ $variable?: boolean }>`
  font-weight: 700;
  font-size: 15px;
  color: ${props => props.$variable ? theme.colors.textMuted : theme.colors.text};
  font-family: ${theme.typography.fontFamilyHeading};
`;

const VariableChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${theme.colors.primary}0D;
  color: ${theme.colors.primary};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const MarginPill = styled.span<{ $pct: number }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$pct >= 70 ? '#E8F5E8' : props.$pct >= 40 ? '#FFF8E1' : '#FFF0EC'};
  color: ${props => props.$pct >= 70 ? '#2E7D32' : props.$pct >= 40 ? '#F57F17' : '#C62828'};

  svg { width: 12px; height: 12px; }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  background: ${props => props.$active ? '#E8F5E8' : '#FFF0EC'};
  color: ${props => props.$active ? '#2E7D32' : '#C62828'};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const DesktopTable = styled.div`
  @media (max-width: 900px) {
    display: none;
  }
`;

// Mobile cards
const MobileCards = styled.div`
  display: none;
  @media (max-width: 900px) {
    display: flex;
    flex-direction: column;
  }
`;

const MobileCard = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.colors.borderLight};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.primary}06;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const MobileCardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const MobileCardName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${theme.colors.text};
`;

const MobileCardDesc = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin-top: 2px;
`;

const MobileCardChips = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

// ============================================
// MODAL STYLED COMPONENTS
// ============================================
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: ${fadeIn} 0.2s ease;
`;

const Modal = styled.div`
  background: ${theme.colors.surface};
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${slideIn} 0.3s ease;
`;

const ModalServiceHeader = styled.div<{ $color: string }>`
  padding: 24px 28px 20px;
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  gap: 16px;

  .modal-service-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: ${props => props.$color}15;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$color};
    flex-shrink: 0;
    svg { width: 22px; height: 22px; }
  }

  .modal-service-info {
    flex: 1;
    min-width: 0;

    .modal-service-name {
      font-size: 18px;
      font-weight: 700;
      color: ${theme.colors.text};
      font-family: ${theme.typography.fontFamilyHeading};
      margin-bottom: 2px;
    }

    .modal-service-cat {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: ${props => props.$color};
      background: ${props => props.$color}12;
      padding: 2px 8px;
      border-radius: 6px;
    }
  }
`;

const ModalClose = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: ${theme.colors.surfaceHover};
    color: ${theme.colors.text};
  }
`;

const ModalBody = styled.div`
  padding: 24px 28px;
`;

const ModalSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ModalSectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${theme.colors.borderLight};
`;

const FormGroup = styled.div`
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin-bottom: 6px;
`;

const FormHint = styled.div`
  font-size: 11px;
  color: ${theme.colors.textMuted};
  margin-top: 4px;
  line-height: 1.4;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  background: ${theme.colors.surface};
  font-size: 14px;
  color: ${theme.colors.text};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder { color: ${theme.colors.textMuted}; }
  &:focus {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}15;
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`;

const PriceInputGroup = styled.div`
  position: relative;

  .currency-symbol {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    font-weight: 600;
    color: ${theme.colors.textMuted};
    pointer-events: none;
  }

  input {
    padding-left: 28px;
  }
`;

const ToggleContainer = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  transition: background 0.15s ease;

  &:hover {
    background: ${theme.colors.surfaceHover};
  }
`;

const Toggle = styled.div<{ $active: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: ${props => props.$active ? '#4CAF50' : theme.colors.borderLight};
  position: relative;
  transition: background 0.2s ease;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.$active ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: left 0.2s ease;
  }
`;

const ToggleInfo = styled.div`
  .toggle-label {
    font-size: 14px;
    font-weight: 600;
    color: ${theme.colors.text};
  }
  .toggle-desc {
    font-size: 12px;
    color: ${theme.colors.textSecondary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 28px 24px;
  border-top: 1px solid ${theme.colors.borderLight};
`;

const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  border: ${props => props.$primary ? 'none' : `1px solid ${theme.colors.border}`};
  background: ${props => props.$primary ? theme.colors.primary : theme.colors.surface};
  color: ${props => props.$primary ? 'white' : theme.colors.text};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: ${props => props.$primary ? '0 4px 12px rgba(146, 86, 62, 0.3)' : 'none'};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const SuccessToast = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #F0F9F0;
  border: 1px solid #C3E6C3;
  border-radius: 12px;
  color: #2E7D32;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  animation: ${fadeInUp} 0.3s ease;

  svg { flex-shrink: 0; }
`;

const ErrorToast = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #FFF0EC;
  border: 1px solid #F5C6B8;
  border-radius: 12px;
  color: #C62828;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  animation: ${fadeInUp} 0.3s ease;

  svg { flex-shrink: 0; }
`;

const EmptyState = styled.div`
  padding: 60px 24px;
  text-align: center;
  color: ${theme.colors.textMuted};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.3;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: ${theme.colors.textSecondary};
    margin-bottom: 4px;
  }

  .empty-desc {
    font-size: 13px;
  }
`;

const CreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(146, 86, 62, 0.3);
  }

  svg { width: 18px; height: 18px; }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  background: ${theme.colors.surface};
  font-size: 14px;
  color: ${theme.colors.text};
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}15;
  }
`;

const KeyDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.borderLight};
  border-radius: 8px;
  font-family: monospace;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const ModalCreateHeader = styled.div`
  padding: 24px 28px 20px;
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;

  .modal-create-title {
    display: flex;
    align-items: center;
    gap: 12px;

    .modal-create-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: ${theme.colors.primary}12;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${theme.colors.primary};
      svg { width: 20px; height: 20px; }
    }

    .modal-create-text {
      font-size: 18px;
      font-weight: 700;
      color: ${theme.colors.text};
      font-family: ${theme.typography.fontFamilyHeading};
    }
  }
`;

// ============================================
// HELPERS
// ============================================
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  wellbeing: <Heart />,
  personalized: <Brain />,
  rejuvenation: <Sparkles />,
  iv_therapy: <Droplets />,
  peptide_therapy: <Dna />,
  general: <Stethoscope />,
};

function getCategoryColor(key: string): string {
  const cat = CATEGORIES.find(c => c.key === key);
  return cat?.color || '#8B7355';
}

function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  if (num === 0) return 'Free';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function getPriceRange(items: TreatmentTypeRow[]): string {
  const prices = items
    .filter(i => i.price_usd !== null && i.price_usd > 0)
    .map(i => Number(i.price_usd));
  if (prices.length === 0) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `$${min}`;
  return `$${min} - $${max}`;
}

// ============================================
// COMPONENT
// ============================================
const ServicesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [services, setServices] = useState<TreatmentTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingService, setEditingService] = useState<TreatmentTypeRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formKey, setFormKey] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Form state for editing
  const [formPrice, setFormPrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formLabelPt, setFormLabelPt] = useState('');
  const [formLabelEn, setFormLabelEn] = useState('');
  const [formDescPt, setFormDescPt] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formActive, setFormActive] = useState(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('treatment_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setServices(data as TreatmentTypeRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openEdit = (service: TreatmentTypeRow) => {
    setEditingService(service);
    setFormPrice(service.price_usd !== null ? String(service.price_usd) : '');
    setFormCost(service.cost_usd !== null ? String(service.cost_usd) : '');
    setFormDuration(String(service.duration_minutes));
    setFormLabelPt(service.label_pt);
    setFormLabelEn(service.label_en);
    setFormDescPt(service.description_pt || '');
    setFormDescEn(service.description_en || '');
    setFormActive(service.is_active);
    setErrorMsg('');
  };

  const handleSave = async () => {
    if (!editingService) return;
    setSaving(true);
    setErrorMsg('');

    const updates: Record<string, any> = {
      price_usd: formPrice.trim() === '' ? null : parseFloat(formPrice),
      cost_usd: formCost.trim() === '' ? null : parseFloat(formCost),
      duration_minutes: parseInt(formDuration) || editingService.duration_minutes,
      label_pt: formLabelPt.trim() || editingService.label_pt,
      label_en: formLabelEn.trim() || editingService.label_en,
      description_pt: formDescPt.trim() || null,
      description_en: formDescEn.trim() || null,
      is_active: formActive,
    };

    const { error } = await supabase
      .from('treatment_types')
      .update(updates)
      .eq('key', editingService.key);

    setSaving(false);

    if (error) {
      setErrorMsg(t('services.errorUpdate'));
      return;
    }

    setEditingService(null);
    setSuccessMsg(t('services.successUpdate'));
    setTimeout(() => setSuccessMsg(''), 3000);
    fetchServices();
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditingService(null);
    setFormKey('');
    setFormCategory('general');
    setFormLabelPt('');
    setFormLabelEn('');
    setFormDescPt('');
    setFormDescEn('');
    setFormPrice('');
    setFormCost('');
    setFormDuration('30');
    setFormActive(true);
    setErrorMsg('');
  };

  const handleCreate = async () => {
    if (!formLabelEn.trim() || !formLabelPt.trim()) {
      setErrorMsg(t('services.errorRequired'));
      return;
    }

    const key = formKey.trim() || slugify(formLabelEn);
    if (!key) {
      setErrorMsg(t('services.errorKey'));
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      await callRPC('create_treatment_type', {
        p_key: key,
        p_label_pt: formLabelPt.trim(),
        p_label_en: formLabelEn.trim(),
        p_short_label_pt: null,
        p_short_label_en: null,
        p_description_pt: formDescPt.trim() || null,
        p_description_en: formDescEn.trim() || null,
        p_category: formCategory,
        p_duration_minutes: parseInt(formDuration) || 30,
        p_price_usd: formPrice.trim() === '' ? null : parseFloat(formPrice),
        p_cost_usd: formCost.trim() === '' ? null : parseFloat(formCost),
      });

      setIsCreating(false);
      setSuccessMsg(t('services.successCreate'));
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchServices();
    } catch (err: any) {
      setErrorMsg(err?.message || t('services.errorCreate'));
    } finally {
      setSaving(false);
    }
  };

  // Auto-generate key from English label
  const handleLabelEnChange = (value: string) => {
    setFormLabelEn(value);
    if (isCreating) {
      setFormKey(slugify(value));
    }
  };

  // Filtered services
  const inactiveCount = services.filter(s => !s.is_active).length;
  const filtered = services.filter(s => {
    if (!showInactive && !s.is_active) return false;
    const matchesSearch = !search ||
      s.label_pt.toLowerCase().includes(search.toLowerCase()) ||
      s.label_en.toLowerCase().includes(search.toLowerCase()) ||
      s.key.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const grouped = CATEGORIES
    .map(cat => ({
      category: cat,
      items: filtered.filter(s => s.category === cat.key),
    }))
    .filter(g => g.items.length > 0);

  // Accordion toggle
  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allExpanded = grouped.length > 0 && grouped.every(g => expandedCategories.has(g.category.key));

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(grouped.map(g => g.category.key)));
    }
  };

  // Stats
  const activeServices = services.filter(s => s.is_active);
  const uniqueCategories = new Set(activeServices.map(s => s.category));
  const pricedServices = activeServices.filter(s => s.price_usd !== null && Number(s.price_usd) > 0);
  const avgPrice = pricedServices.length > 0
    ? Math.round(pricedServices.reduce((sum, s) => sum + Number(s.price_usd), 0) / pricedServices.length)
    : 0;
  const servicesWithMargin = activeServices.filter(s => s.price_usd !== null && s.cost_usd !== null);
  const avgMarginPct = servicesWithMargin.length > 0
    ? Math.round(servicesWithMargin.reduce((sum, s) => {
        const p = Number(s.price_usd);
        const c = Number(s.cost_usd);
        return sum + ((p - c) / p * 100);
      }, 0) / servicesWithMargin.length)
    : 0;

  const editColor = editingService ? getCategoryColor(editingService.category) : '#92563E';
  const editCatLabel = editingService
    ? CATEGORIES.find(c => c.key === editingService.category)
    : null;

  return (
    <AdminLayout>
      <PageHeader>
        <HeaderInfo>
          <h1>{t('services.title')}</h1>
          <p>{t('services.subtitle')}</p>
        </HeaderInfo>
        <CreateButton onClick={openCreate}>
          <Plus />
          {t('services.newService')}
        </CreateButton>
      </PageHeader>

      {successMsg && (
        <SuccessToast>
          <Check size={18} />
          {successMsg}
        </SuccessToast>
      )}

      <StatsRow>
        <StatCard $color="#92563E">
          <div className="stat-icon"><Package size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{activeServices.length}</div>
            <div className="stat-label">{t('services.totalServices')}</div>
          </div>
        </StatCard>
        <StatCard $color="#B48F7A">
          <div className="stat-icon"><Tag size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{uniqueCategories.size}</div>
            <div className="stat-label">{t('services.categories')}</div>
          </div>
        </StatCard>
        <StatCard $color="#6B8E6B">
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">${avgPrice}</div>
            <div className="stat-label">{t('services.avgPrice')}</div>
          </div>
        </StatCard>
        <StatCard $color="#C4836A">
          <div className="stat-icon"><Percent size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{avgMarginPct}%</div>
            <div className="stat-label">{t('services.avgMargin')}</div>
          </div>
        </StatCard>
      </StatsRow>

      <FiltersRow>
        <SearchInput>
          <Search />
          <input
            type="text"
            placeholder={t('services.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchInput>
        <CategoryFilter>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">{t('services.allCategories')}</option>
            {CATEGORIES.map(cat => (
              <option key={cat.key} value={cat.key}>
                {lang === 'en' ? cat.labelEn : cat.label}
              </option>
            ))}
          </select>
          <ChevronDown />
        </CategoryFilter>
        {inactiveCount > 0 && (
          <InactiveToggle
            $active={showInactive}
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <EyeOff /> : <Eye />}
            {showInactive
              ? t('services.hideInactive')
              : `${t('services.showInactive')} (${inactiveCount})`
            }
          </InactiveToggle>
        )}
        <ExpandAllButton onClick={toggleAll}>
          <ChevronsUpDown />
          {allExpanded ? t('services.collapseAll') : t('services.expandAll')}
        </ExpandAllButton>
      </FiltersRow>

      <TableContainer>
        {grouped.map(group => {
          const isExpanded = expandedCategories.has(group.category.key);
          return (
            <React.Fragment key={group.category.key}>
              <CategoryHeaderRow
                $color={group.category.color}
                $expanded={isExpanded}
                onClick={() => toggleCategory(group.category.key)}
              >
                <div className="cat-chevron">
                  <ChevronRight />
                </div>
                <div className="cat-icon">
                  {CATEGORY_ICONS[group.category.key]}
                </div>
                <span className="cat-label">
                  {lang === 'en' ? group.category.labelEn : group.category.label}
                </span>
                <span className="cat-count">
                  {group.items.length}
                </span>
                <span className="cat-range">
                  {getPriceRange(group.items)}
                </span>
              </CategoryHeaderRow>

              {isExpanded && <AccordionContent>
                {/* Desktop Table */}
                <DesktopTable>
                  <Table>
                    <thead>
                      <tr>
                        <Th style={{ width: '35%' }}>{t('services.service')}</Th>
                        <Th>{t('services.duration')}</Th>
                        <Th>{t('services.price')}</Th>
                        <Th>{t('services.margin')}</Th>
                        <Th style={{ textAlign: 'center' }}>{t('services.sectionStatus')}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(s => {
                        const price = s.price_usd !== null ? Number(s.price_usd) : null;
                        const cost = s.cost_usd !== null ? Number(s.cost_usd) : null;
                        const margin = (price !== null && cost !== null) ? price - cost : null;
                        const marginPct = (price !== null && cost !== null && price > 0)
                          ? Math.round((price - cost) / price * 100)
                          : null;

                        return (
                          <Tr key={s.key} $inactive={!s.is_active} onClick={() => openEdit(s)}>
                            <Td>
                              <ServiceText>
                                <div className="service-name">
                                  {lang === 'en' ? s.label_en : s.label_pt}
                                </div>
                                <div className="service-desc">
                                  {lang === 'en' ? s.description_en : s.description_pt}
                                </div>
                              </ServiceText>
                            </Td>
                            <Td>
                              <DurationChip>
                                <Clock />
                                {s.duration_minutes} min
                              </DurationChip>
                            </Td>
                            <Td>
                              {price === null ? (
                                <VariableChip>
                                  <TrendingUp size={12} />
                                  {t('services.variable')}
                                </VariableChip>
                              ) : (
                                <PriceDisplay>{formatUsd(price)}</PriceDisplay>
                              )}
                            </Td>
                            <Td>
                              {marginPct !== null ? (
                                <MarginPill $pct={marginPct}>
                                  <ArrowUpRight />
                                  {marginPct}% ({formatUsd(margin)})
                                </MarginPill>
                              ) : (
                                <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>
                                  {cost !== null ? formatUsd(cost) + ' cost' : ''}
                                </span>
                              )}
                            </Td>
                            <Td style={{ textAlign: 'center' }}>
                              <StatusBadge $active={s.is_active}>
                                {s.is_active ? t('services.active') : t('services.inactive')}
                              </StatusBadge>
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </DesktopTable>

                {/* Mobile Cards */}
                <MobileCards>
                  {group.items.map(s => {
                    const price = s.price_usd !== null ? Number(s.price_usd) : null;
                    const cost = s.cost_usd !== null ? Number(s.cost_usd) : null;
                    const marginPct = (price !== null && cost !== null && price > 0)
                      ? Math.round((price - cost) / price * 100)
                      : null;
                    return (
                      <MobileCard key={s.key} onClick={() => openEdit(s)}>
                        <MobileCardTop>
                          <div>
                            <MobileCardName>{lang === 'en' ? s.label_en : s.label_pt}</MobileCardName>
                            <MobileCardDesc>{lang === 'en' ? s.description_en : s.description_pt}</MobileCardDesc>
                          </div>
                          <StatusBadge $active={s.is_active}>
                            {s.is_active ? t('services.active') : t('services.inactive')}
                          </StatusBadge>
                        </MobileCardTop>
                        <MobileCardChips>
                          <DurationChip>
                            <Clock />
                            {s.duration_minutes} min
                          </DurationChip>
                          {price === null ? (
                            <VariableChip>
                              <TrendingUp size={12} />
                              {t('services.variable')}
                            </VariableChip>
                          ) : (
                            <PriceDisplay>{formatUsd(price)}</PriceDisplay>
                          )}
                          {marginPct !== null && (
                            <MarginPill $pct={marginPct}>
                              <ArrowUpRight />
                              {marginPct}%
                            </MarginPill>
                          )}
                        </MobileCardChips>
                      </MobileCard>
                    );
                  })}
                </MobileCards>
              </AccordionContent>}
            </React.Fragment>
          );
        })}

        {loading && (
          <EmptyState>
            <Package />
            <div className="empty-title">{t('common.loading')}</div>
          </EmptyState>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState>
            <Search />
            <div className="empty-title">{t('services.noResults')}</div>
            <div className="empty-desc">{t('services.noResultsDesc')}</div>
          </EmptyState>
        )}
      </TableContainer>

      {/* Edit Modal */}
      {editingService && (
        <Overlay onClick={() => setEditingService(null)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalServiceHeader $color={editColor}>
              <div className="modal-service-icon">
                {CATEGORY_ICONS[editingService.category]}
              </div>
              <div className="modal-service-info">
                <div className="modal-service-name">
                  {lang === 'en' ? editingService.label_en : editingService.label_pt}
                </div>
                <span className="modal-service-cat">
                  {editCatLabel && (lang === 'en' ? editCatLabel.labelEn : editCatLabel.label)}
                </span>
              </div>
              <ModalClose onClick={() => setEditingService(null)}>
                <X size={20} />
              </ModalClose>
            </ModalServiceHeader>

            <ModalBody>
              {errorMsg && (
                <ErrorToast>
                  <AlertCircle size={18} />
                  {errorMsg}
                </ErrorToast>
              )}

              <ModalSection>
                <ModalSectionTitle>{t('services.pricing')}</ModalSectionTitle>
                <FormRow>
                  <FormGroup>
                    <FormLabel>{t('services.price')}</FormLabel>
                    <PriceInputGroup>
                      <span className="currency-symbol">$</span>
                      <FormInput
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('common.pricePlaceholder')}
                        value={formPrice}
                        onChange={e => setFormPrice(e.target.value)}
                      />
                    </PriceInputGroup>
                    <FormHint>{t('services.priceHint')}</FormHint>
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>{t('services.cost')}</FormLabel>
                    <PriceInputGroup>
                      <span className="currency-symbol">$</span>
                      <FormInput
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('common.pricePlaceholder')}
                        value={formCost}
                        onChange={e => setFormCost(e.target.value)}
                      />
                    </PriceInputGroup>
                    <FormHint>{t('services.costHint')}</FormHint>
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <FormLabel>{t('services.duration')}</FormLabel>
                  <FormInput
                    type="number"
                    min="5"
                    step="5"
                    value={formDuration}
                    onChange={e => setFormDuration(e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <FormHint>{t('common.minutes')}</FormHint>
                </FormGroup>
              </ModalSection>

              <ModalSection>
                <ModalSectionTitle>{t('services.labels')}</ModalSectionTitle>
                <FormRow>
                  <FormGroup>
                    <FormLabel>{t('services.labelPt')}</FormLabel>
                    <FormInput
                      value={formLabelPt}
                      onChange={e => setFormLabelPt(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>{t('services.labelEn')}</FormLabel>
                    <FormInput
                      value={formLabelEn}
                      onChange={e => setFormLabelEn(e.target.value)}
                    />
                  </FormGroup>
                </FormRow>
                <FormRow>
                  <FormGroup>
                    <FormLabel>{t('services.descriptionPt')}</FormLabel>
                    <FormInput
                      value={formDescPt}
                      onChange={e => setFormDescPt(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>{t('services.descriptionEn')}</FormLabel>
                    <FormInput
                      value={formDescEn}
                      onChange={e => setFormDescEn(e.target.value)}
                    />
                  </FormGroup>
                </FormRow>
              </ModalSection>

              <ModalSection>
                <ModalSectionTitle>{t('services.sectionStatus')}</ModalSectionTitle>
                <ToggleContainer onClick={() => setFormActive(!formActive)}>
                  <Toggle $active={formActive} />
                  <ToggleInfo>
                    <div className="toggle-label">
                      {formActive ? t('services.active') : t('services.inactive')}
                    </div>
                    <div className="toggle-desc">
                      {formActive ? t('services.activeDesc') : t('services.inactiveDesc')}
                    </div>
                  </ToggleInfo>
                </ToggleContainer>
              </ModalSection>
            </ModalBody>

            <ModalActions>
              <ModalButton onClick={() => setEditingService(null)}>
                {t('common.cancel')}
              </ModalButton>
              <ModalButton $primary onClick={handleSave} disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </ModalButton>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
      {/* Create Modal */}
      {isCreating && (
        <Overlay onClick={() => setIsCreating(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <ModalCreateHeader>
              <div className="modal-create-title">
                <div className="modal-create-icon"><Plus /></div>
                <span className="modal-create-text">{t('services.newService')}</span>
              </div>
              <ModalClose onClick={() => setIsCreating(false)}>
                <X size={20} />
              </ModalClose>
            </ModalCreateHeader>

            <ModalBody>
              {errorMsg && (
                <ErrorToast>
                  <AlertCircle size={18} />
                  {errorMsg}
                </ErrorToast>
              )}

              <ModalSection>
                <ModalSectionTitle>{t('services.service')}</ModalSectionTitle>
                <FormGroup>
                  <FormLabel>{t('services.category')}</FormLabel>
                  <FormSelect
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.key} value={cat.key}>
                        {lang === 'en' ? cat.labelEn : cat.label}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormRow>
                  <FormGroup>
                    <FormLabel>{t('services.labelEn')} *</FormLabel>
                    <FormInput
                      value={formLabelEn}
                      onChange={e => handleLabelEnChange(e.target.value)}
                      placeholder={t('services.labelEnPlaceholder')}
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>{t('services.labelPt')} *</FormLabel>
                    <FormInput
                      value={formLabelPt}
                      onChange={e => setFormLabelPt(e.target.value)}
                      placeholder={t('services.labelPtPlaceholder')}
                    />
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <FormLabel>{t('services.serviceKey')}</FormLabel>
                  <KeyDisplay>{formKey || '...'}</KeyDisplay>
                  <FormHint>{t('services.serviceKeyHint')}</FormHint>
                </FormGroup>
              </ModalSection>

              <ModalSection>
                <ModalSectionTitle>{t('services.pricing')}</ModalSectionTitle>
                <FormRow>
                  <FormGroup>
                    <FormLabel>{t('services.price')}</FormLabel>
                    <PriceInputGroup>
                      <span className="currency-symbol">$</span>
                      <FormInput
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('common.pricePlaceholder')}
                        value={formPrice}
                        onChange={e => setFormPrice(e.target.value)}
                      />
                    </PriceInputGroup>
                    <FormHint>{t('services.priceHint')}</FormHint>
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>{t('services.cost')}</FormLabel>
                    <PriceInputGroup>
                      <span className="currency-symbol">$</span>
                      <FormInput
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t('common.pricePlaceholder')}
                        value={formCost}
                        onChange={e => setFormCost(e.target.value)}
                      />
                    </PriceInputGroup>
                  </FormGroup>
                </FormRow>
                <FormGroup>
                  <FormLabel>{t('services.duration')}</FormLabel>
                  <FormInput
                    type="number"
                    min="5"
                    step="5"
                    value={formDuration}
                    onChange={e => setFormDuration(e.target.value)}
                    style={{ maxWidth: 120 }}
                  />
                  <FormHint>{t('common.minutes')}</FormHint>
                </FormGroup>
              </ModalSection>

              <ModalSection>
                <ModalSectionTitle>{t('services.descriptions')}</ModalSectionTitle>
                <FormRow>
                  <FormGroup>
                    <FormLabel>{t('services.descriptionEn')}</FormLabel>
                    <FormInput
                      value={formDescEn}
                      onChange={e => setFormDescEn(e.target.value)}
                      placeholder={t('services.descriptionEnPlaceholder')}
                    />
                  </FormGroup>
                  <FormGroup>
                    <FormLabel>{t('services.descriptionPt')}</FormLabel>
                    <FormInput
                      value={formDescPt}
                      onChange={e => setFormDescPt(e.target.value)}
                      placeholder={t('services.descriptionPtPlaceholder')}
                    />
                  </FormGroup>
                </FormRow>
              </ModalSection>
            </ModalBody>

            <ModalActions>
              <ModalButton onClick={() => setIsCreating(false)}>
                {t('common.cancel')}
              </ModalButton>
              <ModalButton
                $primary
                onClick={handleCreate}
                disabled={saving || !formLabelEn.trim() || !formLabelPt.trim()}
              >
                {saving ? t('common.saving') : t('services.createService')}
              </ModalButton>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </AdminLayout>
  );
};

export default ServicesPage;
