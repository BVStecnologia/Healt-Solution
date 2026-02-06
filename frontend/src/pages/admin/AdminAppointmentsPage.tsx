import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  User,
  Stethoscope,
  CalendarDays,
  AlertCircle,
  CheckCheck,
  XOctagon,
  UserX,
  Eye,
  MessageCircle,
  GripVertical,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminLayout from '../../components/admin/AdminLayout';
import { theme } from '../../styles/GlobalStyle';
import { supabase } from '../../lib/supabaseClient';
import { useWhatsAppNotifications } from '../../hooks/admin/useWhatsAppNotifications';
import { useCurrentProvider } from '../../hooks/useCurrentProvider';

// ============================================
// ANIMATIONS
// ============================================
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ============================================
// LUXURY COLOR PALETTE
// ============================================
const luxuryColors = {
  // Accent colors (hex for concatenation/dynamic props)
  primary: '#92563E',
  primaryLight: '#B8956E',
  primaryDark: '#6B3D2A',
  gold: '#D4AF37',
  goldMuted: '#C9A962',
  success: '#6B8E6B',
  warning: '#C9923E',
  danger: '#B85C5C',
  info: '#5B7B9A',
  infoLight: '#EBF2F7',
  // Theme-responsive colors (CSS variables - adapt to dark mode)
  cream: theme.colors.background,
  warmWhite: theme.colors.surface,
  beige: theme.colors.borderLight,
  beigeLight: theme.colors.background,
  textDark: theme.colors.text,
  textMuted: theme.colors.textSecondary,
  successLight: theme.colors.successLight,
  warningLight: theme.colors.warningLight,
  dangerLight: theme.colors.errorLight,
};

// Status colors mapping
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: luxuryColors.warningLight, text: luxuryColors.warning, border: `${luxuryColors.warning}40` },
  confirmed: { bg: luxuryColors.successLight, text: luxuryColors.success, border: `${luxuryColors.success}40` },
  checked_in: { bg: luxuryColors.infoLight, text: luxuryColors.info, border: `${luxuryColors.info}40` },
  in_progress: { bg: `${luxuryColors.primary}15`, text: luxuryColors.primary, border: `${luxuryColors.primary}40` },
  completed: { bg: `${luxuryColors.gold}15`, text: luxuryColors.goldMuted, border: `${luxuryColors.gold}40` },
  cancelled: { bg: luxuryColors.dangerLight, text: luxuryColors.danger, border: `${luxuryColors.danger}40` },
  no_show: { bg: luxuryColors.beige, text: luxuryColors.textMuted, border: `${luxuryColors.textMuted}40` },
};

// ============================================
// STYLED COMPONENTS
// ============================================
const PageWrapper = styled.div`
  animation: ${fadeInUp} 0.6s ease-out;
  max-width: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  margin-bottom: 32px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, ${luxuryColors.primary}, ${luxuryColors.gold});
    border-radius: 2px;
  }

  h1 {
    font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
    font-size: 36px;
    font-weight: 600;
    color: ${luxuryColors.textDark};
    margin: 0 0 6px;
    letter-spacing: -0.5px;
  }

  p {
    color: ${luxuryColors.textMuted};
    margin: 0;
    font-size: 15px;
    font-weight: 400;
  }
`;

const StatsBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.5s ease-out 0.1s both;
`;

const StatPill = styled.div<{ $active?: boolean; $color?: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.$active ? luxuryColors.primary : luxuryColors.warmWhite};
  color: ${props => props.$active ? 'white' : luxuryColors.textDark};
  border-radius: 25px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${props => props.$active ? luxuryColors.primary : 'rgba(146, 86, 62, 0.1)'};
  box-shadow: ${props => props.$active ? `0 4px 12px ${luxuryColors.primary}30` : 'none'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(146, 86, 62, 0.15);
    border-color: ${luxuryColors.primary};
  }

  .count {
    background: ${props => props.$active ? 'rgba(255,255,255,0.25)' : props.$color || luxuryColors.beige};
    color: ${props => props.$active ? 'white' : props.$color ? luxuryColors.textDark : luxuryColors.textMuted};
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.5s ease-out 0.2s both;
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 280px;
  position: relative;

  svg {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: ${luxuryColors.textMuted};
    transition: color 0.2s ease;
  }

  input {
    width: 100%;
    padding: 14px 16px 14px 48px;
    border: 1px solid rgba(146, 86, 62, 0.12);
    border-radius: 14px;
    font-size: 14px;
    background: ${luxuryColors.warmWhite};
    color: ${luxuryColors.textDark};
    transition: all 0.3s ease;

    &::placeholder {
      color: ${luxuryColors.textMuted};
    }

    &:focus {
      outline: none;
      border-color: ${luxuryColors.primary};
      box-shadow: 0 0 0 3px ${luxuryColors.primary}15;
    }

    &:focus + svg {
      color: ${luxuryColors.primary};
    }
  }
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: ${props => props.$active ? luxuryColors.primary : luxuryColors.warmWhite};
  color: ${props => props.$active ? 'white' : luxuryColors.textDark};
  border: 1px solid ${props => props.$active ? luxuryColors.primary : 'rgba(146, 86, 62, 0.12)'};
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    border-color: ${luxuryColors.primary};
    background: ${props => props.$active ? luxuryColors.primaryDark : luxuryColors.beigeLight};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 40px;
  background: ${luxuryColors.warmWhite};
  border-radius: 20px;
  border: 1px dashed rgba(146, 86, 62, 0.2);
  animation: ${fadeInUp} 0.5s ease-out;

  svg {
    width: 64px;
    height: 64px;
    color: ${luxuryColors.primaryLight};
    margin-bottom: 20px;
    opacity: 0.6;
  }

  h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 24px;
    font-weight: 600;
    color: ${luxuryColors.textDark};
    margin: 0 0 8px;
  }

  p {
    color: ${luxuryColors.textMuted};
    font-size: 15px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// ============================================
// KANBAN STYLES
// ============================================
const KanbanWrapper = styled.div`
  display: flex;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  min-width: 0;
  max-width: calc(100vw - 270px - 80px); /* viewport - sidebar - paddings */

  @media (max-width: 768px) {
    max-width: calc(100vw - 32px);
    gap: 4px;
  }
`;

// Animação de brilho percorrendo o botão
const shimmerGlow = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// Animação suave de respiração
const breathe = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow:
      0 4px 20px rgba(146, 86, 62, 0.12),
      0 8px 32px rgba(212, 175, 55, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }
  50% {
    transform: scale(1.02);
    box-shadow:
      0 6px 28px rgba(146, 86, 62, 0.18),
      0 12px 40px rgba(212, 175, 55, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.7);
  }
`;

// Animação da seta - deslize suave
const arrowSlide = keyframes`
  0%, 100% {
    transform: translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateX(4px);
    opacity: 0.7;
  }
`;

const arrowSlideLeft = keyframes`
  0%, 100% {
    transform: translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateX(-4px);
    opacity: 0.7;
  }
`;

// Botões de navegação lateral - Design pill vertical com glassmorphism
const ScrollNavButton = styled.button<{ $visible: boolean; $direction?: 'left' | 'right' }>`
  width: 44px;
  height: 96px;
  min-width: 44px;
  border-radius: 22px;
  background: ${props => props.$visible
    ? `linear-gradient(
        180deg,
        rgba(253, 248, 243, 0.95) 0%,
        rgba(245, 237, 228, 0.9) 50%,
        rgba(253, 248, 243, 0.95) 100%
      )`
    : 'transparent'};
  backdrop-filter: ${props => props.$visible ? 'blur(12px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.$visible ? 'blur(12px)' : 'none'};
  border: none;
  cursor: ${props => props.$visible ? 'pointer' : 'default'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;

  /* Sombra em camadas elegante */
  box-shadow: ${props => props.$visible ? `
    0 4px 20px rgba(146, 86, 62, 0.12),
    0 8px 32px rgba(212, 175, 55, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5)
  ` : 'none'};

  /* Borda gradiente dourada */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 22px;
    padding: 1.5px;
    background: ${props => props.$visible
      ? `linear-gradient(
          180deg,
          rgba(212, 175, 55, 0.5) 0%,
          rgba(146, 86, 62, 0.3) 50%,
          rgba(212, 175, 55, 0.5) 100%
        )`
      : 'transparent'};
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    transition: all 0.4s ease;
  }

  /* Efeito shimmer que percorre o botão */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(212, 175, 55, 0.15) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    opacity: ${props => props.$visible ? 1 : 0};
    animation: ${props => props.$visible ? css`${shimmerGlow} 3s ease-in-out infinite` : 'none'};
    pointer-events: none;
    border-radius: 22px;
  }

  /* Animação de respiração quando visível */
  ${props => props.$visible && css`
    animation: ${breathe} 4s ease-in-out infinite;
  `}

  /* Container do ícone */
  .icon-wrapper {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      ${luxuryColors.primary} 0%,
      ${luxuryColors.primaryDark} 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    box-shadow:
      0 2px 8px rgba(146, 86, 62, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  svg {
    width: 18px;
    height: 18px;
    color: white;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }

  /* Animação da seta direita */
  ${props => props.$visible && props.$direction === 'right' && css`
    svg {
      animation: ${arrowSlide} 2s ease-in-out infinite;
    }
  `}

  /* Animação da seta esquerda */
  ${props => props.$visible && props.$direction === 'left' && css`
    svg {
      animation: ${arrowSlideLeft} 2s ease-in-out infinite;
    }
  `}

  /* Indicadores de pontos decorativos */
  .dots {
    display: flex;
    flex-direction: column;
    gap: 3px;
    position: relative;
    z-index: 1;
  }

  .dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${luxuryColors.gold};
    opacity: 0.4;
    transition: all 0.3s ease;
  }

  &:hover {
    ${props => props.$visible && css`
      animation: none;
      transform: scale(1.05);
      box-shadow:
        0 8px 32px rgba(146, 86, 62, 0.2),
        0 16px 48px rgba(212, 175, 55, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);

      &::before {
        background: linear-gradient(
          180deg,
          rgba(212, 175, 55, 0.8) 0%,
          rgba(146, 86, 62, 0.5) 50%,
          rgba(212, 175, 55, 0.8) 100%
        );
      }

      &::after {
        animation: none;
        opacity: 0;
      }

      .icon-wrapper {
        transform: scale(1.1);
        box-shadow:
          0 4px 16px rgba(146, 86, 62, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        background: linear-gradient(
          135deg,
          ${luxuryColors.gold} 0%,
          ${luxuryColors.primary} 100%
        );
      }

      svg {
        animation: none;
        transform: scale(1.1);
      }

      .dot {
        opacity: 0.8;
        background: ${luxuryColors.primary};
      }
    `}
  }

  &:active {
    ${props => props.$visible && css`
      transform: scale(0.98);
      box-shadow:
        0 2px 12px rgba(146, 86, 62, 0.15),
        inset 0 2px 4px rgba(0, 0, 0, 0.05);

      .icon-wrapper {
        transform: scale(0.95);
      }
    `}
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const KanbanContainer = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 4px 4px 20px;
  min-height: 600px;
  scroll-behavior: smooth;
  flex: 1;
  min-width: 0; /* Força o container a respeitar o limite do pai flex */

  /* Scrollbar horizontal bem visível */
  &::-webkit-scrollbar {
    height: 12px;
  }

  &::-webkit-scrollbar-track {
    background: ${luxuryColors.beige};
    border-radius: 6px;
    margin: 0 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, ${luxuryColors.primary}90, ${luxuryColors.primaryDark}90);
    border-radius: 6px;
    border: 2px solid ${luxuryColors.beige};

    &:hover {
      background: linear-gradient(180deg, ${luxuryColors.primary}, ${luxuryColors.primaryDark});
    }
  }

  @media (max-width: 768px) {
    gap: 12px;
    min-height: 450px;
    padding: 4px 4px 16px;
    -webkit-overflow-scrolling: touch;
  }
`;

const KanbanColumn = styled.div<{ $color?: string }>`
  flex: 0 0 320px;
  min-width: 320px;
  background: ${luxuryColors.beigeLight};
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 280px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
  position: relative;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &::before {
    content: '';
    display: block;
    height: 5px;
    background: ${props => props.$color || luxuryColors.primary};
    border-radius: 16px 16px 0 0;
    flex-shrink: 0;
  }

  /* Indicador de mais conteúdo no fundo */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to top, ${luxuryColors.beigeLight} 0%, transparent 100%);
    border-radius: 0 0 16px 16px;
    pointer-events: none;
    z-index: 1;
  }

  @media (max-width: 768px) {
    flex: 0 0 260px;
    min-width: 260px;
    border-radius: 12px;
    max-height: calc(100vh - 220px);

    &::before {
      border-radius: 12px 12px 0 0;
    }
    &::after {
      border-radius: 0 0 12px 12px;
    }
  }
`;

const ColumnHeader = styled.div`
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(146, 86, 62, 0.08);

  .title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 14px;
    color: ${luxuryColors.textDark};

    svg {
      width: 18px;
      height: 18px;
      opacity: 0.7;
    }
  }

  .count {
    background: rgba(146, 86, 62, 0.1);
    color: ${luxuryColors.textMuted};
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding: 12px 14px;

    .title {
      font-size: 13px;
      gap: 6px;
    }
  }
`;

const ColumnContentWrapper = styled.div`
  flex: 1;
  display: flex;
  position: relative;
  min-height: 0;
`;

const ColumnContent = styled.div`
  flex: 1;
  padding: 16px;
  padding-right: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 14px;

  /* Scrollbar vertical */
  &::-webkit-scrollbar {
    width: 0;
  }

  @media (max-width: 768px) {
    padding: 10px;
    padding-right: 4px;
    gap: 10px;
  }
`;

// Track sempre visível no lado direito
const ScrollTrack = styled.div`
  width: 8px;
  background: ${luxuryColors.beige};
  border-radius: 4px;
  margin: 12px 8px 12px 4px;
  position: relative;
  flex-shrink: 0;
  border: 1px solid rgba(146, 86, 62, 0.12);
`;

const ScrollThumb = styled.div<{ $height: number; $top: number }>`
  position: absolute;
  width: 100%;
  height: ${props => Math.max(props.$height, 20)}%;
  top: ${props => props.$top}%;
  background: linear-gradient(180deg, ${luxuryColors.primary}, ${luxuryColors.primaryDark});
  border-radius: 4px;
  transition: top 0.1s ease-out, height 0.1s ease-out;
  cursor: pointer;

  &:hover {
    background: linear-gradient(180deg, ${luxuryColors.primaryLight}, ${luxuryColors.primary});
  }
`;

// Indicador de mais conteúdo
const MoreIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: 8px;
  left: 16px;
  right: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, ${luxuryColors.primary}15, ${luxuryColors.primaryLight}20);
  border: 1px solid ${luxuryColors.primary}30;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: ${luxuryColors.primary};
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? 0 : '10px'});
  transition: all 0.3s ease;
  pointer-events: none;
  z-index: 5;
  backdrop-filter: blur(4px);

  svg {
    width: 14px;
    height: 14px;
    animation: bounce 1.5s infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3px); }
  }
`;

const KanbanCard = styled.div<{ $isDragging?: boolean; $patientType?: string }>`
  background: ${luxuryColors.warmWhite};
  border-radius: 14px;
  padding: 18px;
  cursor: grab;

  @media (max-width: 768px) {
    padding: 12px;
    border-radius: 10px;
  }
  transition: all 0.2s ease;
  border: 1px solid rgba(146, 86, 62, 0.08);
  position: relative;
  opacity: ${props => props.$isDragging ? 0.5 : 1};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

  &:hover {
    box-shadow: 0 6px 20px rgba(146, 86, 62, 0.15);
    transform: translateY(-3px);
    border-color: rgba(146, 86, 62, 0.15);
  }

  &:active {
    cursor: grabbing;
    transform: scale(1.02);
  }

  .drag-handle {
    position: absolute;
    top: 16px;
    right: 12px;
    color: ${luxuryColors.textMuted};
    opacity: 0.3;
    transition: all 0.2s;
  }

  &:hover .drag-handle {
    opacity: 0.7;
    color: ${luxuryColors.primary};
  }
`;

const KanbanCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
`;

const KanbanAvatar = styled.div<{ $patientType?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;

  ${props => {
    switch (props.$patientType) {
      case 'vip':
        return css`
          background: linear-gradient(135deg, #D4AF37, #F4D03F);
          color: #5D4E37;
        `;
      case 'trt':
        return css`
          background: linear-gradient(135deg, #8B5CF6, #A78BFA);
          color: white;
        `;
      case 'hormone':
        return css`
          background: linear-gradient(135deg, #EC4899, #F472B6);
          color: white;
        `;
      default:
        return css`
          background: linear-gradient(135deg, ${luxuryColors.primary}, ${luxuryColors.primaryLight});
          color: white;
        `;
    }
  }}
`;

const KanbanPatientInfo = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    font-weight: 600;
    font-size: 14px;
    color: ${luxuryColors.textDark};
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 20px;
  }

  .type {
    font-size: 11px;
    color: ${luxuryColors.primary};
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const KanbanCardDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: ${luxuryColors.textMuted};
  padding: 12px 0;
  margin-top: 2px;
  border-top: 1px dashed rgba(146, 86, 62, 0.12);

  .detail {
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
      width: 15px;
      height: 15px;
      color: ${luxuryColors.primaryLight};
      flex-shrink: 0;
    }

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;

const KanbanCardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid rgba(146, 86, 62, 0.08);
`;

const KanbanActionBtn = styled.button<{ $variant?: 'approve' | 'reject' | 'view' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 8px;
  border: none;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  ${props => {
    switch (props.$variant) {
      case 'approve':
        return css`
          background: ${luxuryColors.successLight};
          color: ${luxuryColors.success};
          border: 1px solid transparent;
          &:hover {
            background: ${luxuryColors.success};
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 3px 8px ${luxuryColors.success}40;
          }
        `;
      case 'reject':
        return css`
          background: ${luxuryColors.dangerLight};
          color: ${luxuryColors.danger};
          border: 1px solid transparent;
          &:hover {
            background: ${luxuryColors.danger};
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 3px 8px ${luxuryColors.danger}40;
          }
        `;
      default:
        return css`
          background: ${luxuryColors.beige};
          color: ${luxuryColors.textDark};
          border: 1px solid rgba(146, 86, 62, 0.1);
          &:hover {
            background: ${luxuryColors.primary};
            color: white;
            border-color: ${luxuryColors.primary};
            transform: translateY(-1px);
            box-shadow: 0 3px 8px ${luxuryColors.primary}40;
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const DragOverlayCard = styled(KanbanCard)`
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  transform: rotate(3deg);
  cursor: grabbing;
`;

const EmptyColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: ${luxuryColors.textMuted};
  font-size: 13px;

  svg {
    width: 32px;
    height: 32px;
    opacity: 0.3;
    margin-bottom: 8px;
  }
`;

const SkeletonCard = styled.div`
  background: ${luxuryColors.warmWhite};
  border-radius: 18px;
  padding: 24px;
  border: 1px solid rgba(146, 86, 62, 0.06);

  .skeleton-content {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .skeleton-avatar {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(90deg, ${luxuryColors.beige} 25%, ${luxuryColors.beigeLight} 50%, ${luxuryColors.beige} 75%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }

  .skeleton-text {
    flex: 1;

    .line {
      height: 14px;
      background: linear-gradient(90deg, ${luxuryColors.beige} 25%, ${luxuryColors.beigeLight} 50%, ${luxuryColors.beige} 75%);
      background-size: 200% 100%;
      animation: ${shimmer} 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 10px;

      &:first-child {
        width: 40%;
        height: 20px;
      }

      &:last-child {
        width: 60%;
        margin-bottom: 0;
      }
    }
  }
`;

// ============================================
// INTERFACES
// ============================================
interface Appointment {
  id: string;
  patient_id: string;
  provider_id: string;
  scheduled_at: string;
  type: string;
  status: string;
  notes: string | null;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  provider: {
    profile: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
    };
  };
}

interface StatusCount {
  status: string;
  count: number;
}

// ============================================
// KANBAN COLUMN CONFIG
// ============================================
const kanbanColumns = [
  { id: 'pending', title: 'Pendente', icon: AlertCircle, color: luxuryColors.warning },
  { id: 'confirmed', title: 'Confirmada', icon: CheckCircle, color: luxuryColors.success },
  { id: 'checked_in', title: 'Check-in', icon: User, color: luxuryColors.info },
  { id: 'in_progress', title: 'Em Atendimento', icon: Stethoscope, color: luxuryColors.primary },
  { id: 'completed', title: 'Concluída', icon: CheckCheck, color: luxuryColors.gold },
];

// ============================================
// SORTABLE CARD COMPONENT
// ============================================
interface SortableCardProps {
  appointment: Appointment;
  formatType: (type: string) => string;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  getInitials: (first: string, last: string) => string;
  onApprove: (apt: Appointment) => void;
  onReject: (apt: Appointment) => void;
  onViewProfile: (patientId: string) => void;
  processingId: string | null;
}

const SortableCard: React.FC<SortableCardProps> = ({
  appointment,
  formatType,
  formatDate,
  formatTime,
  getInitials,
  onApprove,
  onReject,
  onViewProfile,
  processingId,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: appointment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <KanbanCard
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      {...attributes}
      {...listeners}
    >
      <div className="drag-handle">
        <GripVertical size={16} />
      </div>
      <KanbanCardHeader>
        <KanbanAvatar $patientType={undefined}>
          {getInitials(appointment.patient?.first_name, appointment.patient?.last_name)}
        </KanbanAvatar>
        <KanbanPatientInfo>
          <div className="name">
            {appointment.patient?.first_name} {appointment.patient?.last_name}
          </div>
          <div className="type">{formatType(appointment.type)}</div>
        </KanbanPatientInfo>
      </KanbanCardHeader>
      <KanbanCardDetails>
        <div className="detail">
          <Calendar />
          <span>{formatDate(appointment.scheduled_at)}</span>
        </div>
        <div className="detail">
          <Clock />
          <span>{formatTime(appointment.scheduled_at)}</span>
        </div>
        <div className="detail">
          <Stethoscope />
          <span>
            {appointment.provider?.profile
              ? `Dr(a). ${appointment.provider.profile.first_name}`
              : 'N/A'}
          </span>
        </div>
        {appointment.patient?.phone && (
          <div className="detail">
            <Phone />
            <span>{appointment.patient.phone}</span>
          </div>
        )}
      </KanbanCardDetails>
      <KanbanCardActions>
        {appointment.status === 'pending' && (
          <>
            <KanbanActionBtn
              $variant="approve"
              onClick={(e) => { e.stopPropagation(); onApprove(appointment); }}
              disabled={processingId === appointment.id}
            >
              <CheckCircle /> Aprovar
            </KanbanActionBtn>
            <KanbanActionBtn
              $variant="reject"
              onClick={(e) => { e.stopPropagation(); onReject(appointment); }}
              disabled={processingId === appointment.id}
            >
              <XCircle /> Rejeitar
            </KanbanActionBtn>
          </>
        )}
        <KanbanActionBtn
          $variant="view"
          onClick={(e) => { e.stopPropagation(); onViewProfile(appointment.patient_id); }}
        >
          <Eye /> Perfil
        </KanbanActionBtn>
      </KanbanCardActions>
    </KanbanCard>
  );
};

// ============================================
// DROPPABLE COLUMN COMPONENT
// ============================================
interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  totalItems: number;
  visibleItems: number;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, children, totalItems, visibleItems }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
    data: {
      type: 'column',
      status: id,
    },
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollInfo, setScrollInfo] = useState({ thumbHeight: 100, thumbTop: 0, canScroll: false, hiddenBelow: 0 });

  // Atualizar informações de scroll
  const updateScrollInfo = useCallback(() => {
    if (!contentRef.current) return;

    const el = contentRef.current;
    const canScroll = el.scrollHeight > el.clientHeight;
    const thumbHeight = canScroll ? (el.clientHeight / el.scrollHeight) * 100 : 100;
    const thumbTop = canScroll ? (el.scrollTop / (el.scrollHeight - el.clientHeight)) * (100 - thumbHeight) : 0;

    // Calcular quantos itens estão ocultos abaixo
    const scrollRemaining = el.scrollHeight - el.clientHeight - el.scrollTop;
    const avgItemHeight = el.scrollHeight / totalItems;
    const hiddenBelow = avgItemHeight > 0 ? Math.round(scrollRemaining / avgItemHeight) : 0;

    setScrollInfo({ thumbHeight, thumbTop, canScroll, hiddenBelow });
  }, [totalItems]);

  useEffect(() => {
    updateScrollInfo();
    const el = contentRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollInfo);
      const resizeObserver = new ResizeObserver(updateScrollInfo);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener('scroll', updateScrollInfo);
        resizeObserver.disconnect();
      };
    }
  }, [updateScrollInfo, visibleItems]);

  // Scroll ao clicar no track
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!contentRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = clickY / rect.height;
    contentRef.current.scrollTop = percentage * (contentRef.current.scrollHeight - contentRef.current.clientHeight);
  };

  return (
    <ColumnContentWrapper>
      <ColumnContent
        ref={(node) => {
          setNodeRef(node);
          (contentRef as any).current = node;
        }}
        style={{
          backgroundColor: isOver ? 'rgba(146, 86, 62, 0.08)' : 'transparent',
          transition: 'background-color 0.2s ease',
        }}
      >
        {children}
      </ColumnContent>

      {/* Track sempre visível */}
      <ScrollTrack onClick={handleTrackClick}>
        {scrollInfo.canScroll && (
          <ScrollThumb $height={scrollInfo.thumbHeight} $top={scrollInfo.thumbTop} />
        )}
      </ScrollTrack>

      {/* Indicador de mais conteúdo - só mostra quando há itens ocultos */}
      {scrollInfo.hiddenBelow > 0 && (
        <MoreIndicator $visible={true}>
          <ChevronDown />
          +{scrollInfo.hiddenBelow} {scrollInfo.hiddenBelow === 1 ? 'consulta' : 'consultas'}
        </MoreIndicator>
      )}
    </ColumnContentWrapper>
  );
};

// ============================================
// COMPONENT
// ============================================
// Provider filter dropdown for admin
interface ProviderOption {
  id: string;
  name: string;
}

const ProviderFilterSelect = styled.select`
  padding: 14px 16px;
  border: 1px solid rgba(146, 86, 62, 0.12);
  border-radius: 14px;
  font-size: 14px;
  background: ${luxuryColors.warmWhite};
  color: ${luxuryColors.textDark};
  cursor: pointer;
  min-width: 200px;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238B7355' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: ${luxuryColors.primary};
    box-shadow: 0 0 0 3px ${luxuryColors.primary}15;
  }
`;

const AdminAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { providerId, isProvider, isAdmin } = useCurrentProvider();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [providerOptions, setProviderOptions] = useState<ProviderOption[]>([]);

  // Navegação horizontal do Kanban
  const kanbanContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const {
    sendConfirmation,
    sendRejection,
    sendCancellationCrossNotify,
    isConnected: whatsappReady,
  } = useWhatsAppNotifications();

  // Verificar se pode scrollar horizontalmente
  const updateScrollButtons = useCallback(() => {
    if (!kanbanContainerRef.current) return;
    const el = kanbanContainerRef.current;
    const hasScroll = el.scrollWidth > el.clientWidth;
    const atStart = el.scrollLeft <= 10;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 10;

    setCanScrollLeft(hasScroll && !atStart);
    setCanScrollRight(hasScroll && !atEnd);
  }, []);

  // Scroll horizontal ao clicar nos botões
  const scrollKanban = useCallback((direction: 'left' | 'right') => {
    if (!kanbanContainerRef.current) return;
    const scrollAmount = 340; // Largura de uma coluna + gap
    kanbanContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  // Monitorar scroll do Kanban
  useEffect(() => {
    const el = kanbanContainerRef.current;
    if (el && !loading) {
      // Delay para garantir que o DOM esteja pronto
      const timer = setTimeout(() => {
        updateScrollButtons();
      }, 100);

      el.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);

      return () => {
        clearTimeout(timer);
        el.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [updateScrollButtons, loading, appointments]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get active appointment for drag overlay
  const activeAppointment = useMemo(() => {
    if (!activeId) return null;
    return appointments.find(apt => apt.id === activeId);
  }, [activeId, appointments]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end - update status
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const appointmentId = active.id as string;

    // Determine the new status
    let newStatus: string;

    // Check if dropped on a column (via data)
    if (over.data.current?.type === 'column') {
      newStatus = over.data.current.status;
    } else {
      // Dropped on another card - find which column that card belongs to
      const targetAppointment = appointments.find(apt => apt.id === over.id);
      if (!targetAppointment) return;
      newStatus = targetAppointment.status;
    }

    // Find the dragged appointment
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment || appointment.status === newStatus) return;

    // Optimistic update
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      loadStatusCounts();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      // Revert on error
      loadAppointments();
    }
  };

  // Get appointments by status for Kanban
  const getAppointmentsByStatus = (status: string) => {
    let filtered = appointments.filter(apt => apt.status === status);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(apt =>
        `${apt.patient?.first_name} ${apt.patient?.last_name}`.toLowerCase().includes(query) ||
        apt.provider?.profile?.first_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  // Carregar lista de médicos para dropdown (admin only)
  useEffect(() => {
    if (!isAdmin) return;
    const loadProviders = async () => {
      try {
        const { data } = await supabase
          .from('providers')
          .select('id, profile:profiles(first_name, last_name)')
          .eq('is_active', true);

        const options = (data || []).map((p: any) => {
          const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
          return {
            id: p.id,
            name: prof ? `Dr(a). ${prof.first_name} ${prof.last_name}` : p.id,
          };
        });
        setProviderOptions(options);
      } catch (err) {
        console.error('Error loading providers:', err);
      }
    };
    loadProviders();
  }, [isAdmin]);

  // Determinar qual provider_id usar para filtrar
  const activeProviderId = isProvider ? providerId : (providerFilter !== 'all' ? providerFilter : null);

  useEffect(() => {
    loadAppointments();
    loadStatusCounts();
  }, [activeProviderId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          provider_id,
          scheduled_at,
          type,
          status,
          notes,
          patient:profiles!appointments_patient_id_fkey(id, first_name, last_name, phone),
          provider:providers!appointments_provider_id_fkey(
            profile:profiles(id, first_name, last_name, phone)
          )
        `)
        .order('scheduled_at', { ascending: false });

      // Filtrar por provider se necessário
      if (activeProviderId) {
        query = query.eq('provider_id', activeProviderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform Supabase response - relations come as arrays
      const transformed = (data || []).map((apt: any) => ({
        ...apt,
        patient: Array.isArray(apt.patient) ? apt.patient[0] : apt.patient,
        provider: Array.isArray(apt.provider)
          ? {
              profile: Array.isArray(apt.provider[0]?.profile)
                ? apt.provider[0].profile[0]
                : apt.provider[0]?.profile
            }
          : apt.provider,
      }));

      setAppointments(transformed);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusCounts = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select('status');

      if (activeProviderId) {
        query = query.eq('provider_id', activeProviderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((apt: { status: string }) => {
        counts[apt.status] = (counts[apt.status] || 0) + 1;
      });

      const statusList = Object.entries(counts).map(([status, count]) => ({ status, count }));
      setStatusCounts(statusList);
    } catch (error) {
      console.error('Error loading status counts:', error);
    }
  };

  const handleApprove = async (apt: Appointment) => {
    setProcessingId(apt.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', apt.id);

      if (error) throw error;

      if (apt.patient?.phone && whatsappReady) {
        const date = new Date(apt.scheduled_at);
        await sendConfirmation({
          patientName: `${apt.patient.first_name} ${apt.patient.last_name}`,
          patientPhone: apt.patient.phone,
          patientId: apt.patient_id,
          providerName: apt.provider?.profile ? `Dr(a). ${apt.provider.profile.first_name}` : 'N/A',
          appointmentType: formatType(apt.type),
          appointmentDate: date.toLocaleDateString('pt-BR'),
          appointmentTime: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          appointmentId: apt.id,
        });
      }

      loadAppointments();
      loadStatusCounts();
    } catch (error) {
      console.error('Error approving appointment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (apt: Appointment) => {
    const reason = window.prompt(
      'Motivo da rejeição:\n\n• Horário não disponível\n• Médico indisponível\n• Outro motivo',
      'Horário não disponível'
    );
    if (reason === null) return; // Cancelou o prompt

    setProcessingId(apt.id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || 'Horário não disponível',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', apt.id);

      if (error) throw error;

      // Notificação cruzada: admin cancelou → notifica paciente + médico
      if (whatsappReady) {
        const date = new Date(apt.scheduled_at);
        const providerProfile = apt.provider?.profile;
        await sendCancellationCrossNotify({
          patientName: apt.patient ? `${apt.patient.first_name} ${apt.patient.last_name}` : '',
          patientPhone: apt.patient?.phone || '',
          patientId: apt.patient_id,
          providerName: providerProfile ? `Dr(a). ${providerProfile.first_name} ${providerProfile.last_name}` : 'N/A',
          providerPhone: providerProfile?.phone || '',
          providerUserId: providerProfile?.id,
          appointmentType: formatType(apt.type),
          appointmentDate: `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`,
          appointmentTime: `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`,
          appointmentId: apt.id,
          reason: reason || 'Horário não disponível',
        }, 'admin');
      }

      loadAppointments();
      loadStatusCounts();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatType = (type: string) => {
    const types: Record<string, string> = {
      initial_consultation: 'Consulta Inicial',
      follow_up: 'Retorno',
      hormone_check: 'Avaliação Hormonal',
      lab_review: 'Revisão de Exames',
      nutrition: 'Nutrição',
      health_coaching: 'Health Coaching',
      therapy: 'Terapia',
    };
    return types[type] || type;
  };

  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      checked_in: 'Check-in',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      no_show: 'Não Compareceu',
    };
    return statuses[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle />;
      case 'confirmed': return <CheckCircle />;
      case 'checked_in': return <User />;
      case 'in_progress': return <Stethoscope />;
      case 'completed': return <CheckCheck />;
      case 'cancelled': return <XOctagon />;
      case 'no_show': return <UserX />;
      default: return <Calendar />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusCount = (status: string) => {
    const found = statusCounts.find(s => s.status === status);
    return found?.count || 0;
  };

  const totalCount = statusCounts.reduce((acc, s) => acc + s.count, 0);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    let result = appointments;

    if (statusFilter !== 'all') {
      result = result.filter(apt => apt.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(apt =>
        `${apt.patient?.first_name} ${apt.patient?.last_name}`.toLowerCase().includes(query) ||
        apt.provider?.profile?.first_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [appointments, statusFilter, searchQuery]);

  const statusTabs = [
    { key: 'all', label: 'Todas', count: totalCount },
    { key: 'pending', label: 'Pendentes', count: getStatusCount('pending') },
    { key: 'confirmed', label: 'Confirmadas', count: getStatusCount('confirmed') },
    { key: 'in_progress', label: 'Em Andamento', count: getStatusCount('in_progress') },
    { key: 'completed', label: 'Concluídas', count: getStatusCount('completed') },
    { key: 'cancelled', label: 'Canceladas', count: getStatusCount('cancelled') },
  ];

  return (
    <AdminLayout>
      <PageWrapper>
        <Header>
          <h1>{isProvider ? 'Minhas Consultas' : 'Consultas'}</h1>
          <p>{isProvider ? 'Gerencie suas consultas agendadas' : 'Gerencie todas as consultas da clínica'}</p>
        </Header>

        <StatsBar>
          {statusTabs.map(tab => (
            <StatPill
              key={tab.key}
              $active={statusFilter === tab.key}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              <span className="count">{tab.count}</span>
            </StatPill>
          ))}
        </StatsBar>

        <ControlsBar>
          <SearchBox>
            <input
              type="text"
              placeholder="Buscar por nome do paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search />
          </SearchBox>
          {isAdmin && providerOptions.length > 0 && (
            <ProviderFilterSelect
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">Todos os médicos</option>
              {providerOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </ProviderFilterSelect>
          )}
        </ControlsBar>

        {loading ? (
          <LoadingState>
            {[1, 2, 3, 4, 5].map(i => (
              <SkeletonCard key={i}>
                <div className="skeleton-content">
                  <div className="skeleton-avatar" />
                  <div className="skeleton-text">
                    <div className="line" />
                    <div className="line" />
                  </div>
                </div>
              </SkeletonCard>
            ))}
          </LoadingState>
        ) : (
          /* ============================================
             KANBAN VIEW
             ============================================ */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <KanbanWrapper>
              {/* Botão de navegação esquerda */}
              <ScrollNavButton
                $visible={canScrollLeft}
                $direction="left"
                onClick={() => canScrollLeft && scrollKanban('left')}
                aria-label="Scroll para esquerda"
              >
                <div className="dots">
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <div className="icon-wrapper">
                  <ChevronLeft />
                </div>
                <div className="dots">
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </ScrollNavButton>

              <KanbanContainer ref={kanbanContainerRef}>
              {kanbanColumns.map(column => {
                const columnAppointments = getAppointmentsByStatus(column.id);
                const ColumnIcon = column.icon;

                return (
                  <KanbanColumn key={column.id} $color={column.color}>
                    <ColumnHeader>
                      <div className="title">
                        <ColumnIcon />
                        {column.title}
                      </div>
                      <span className="count">{columnAppointments.length}</span>
                    </ColumnHeader>
                    <DroppableColumn
                      id={column.id}
                      totalItems={columnAppointments.length}
                      visibleItems={columnAppointments.length}
                    >
                      <SortableContext
                        id={column.id}
                        items={columnAppointments.map(apt => apt.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {columnAppointments.length === 0 ? (
                          <EmptyColumn>
                            <CalendarDays />
                            <span>Nenhuma consulta</span>
                          </EmptyColumn>
                        ) : (
                          columnAppointments.map(apt => (
                            <SortableCard
                              key={apt.id}
                              appointment={apt}
                              formatType={formatType}
                              formatDate={formatDate}
                              formatTime={formatTime}
                              getInitials={getInitials}
                              onApprove={handleApprove}
                              onReject={handleReject}
                              onViewProfile={(id) => navigate(`/admin/patients/${id}`, { state: { from: '/admin/appointments' } })}
                              processingId={processingId}
                            />
                          ))
                        )}
                      </SortableContext>
                    </DroppableColumn>
                  </KanbanColumn>
                );
              })}
            </KanbanContainer>

              {/* Botão de navegação direita */}
              <ScrollNavButton
                $visible={canScrollRight}
                $direction="right"
                onClick={() => canScrollRight && scrollKanban('right')}
                aria-label="Scroll para direita"
              >
                <div className="dots">
                  <span className="dot" />
                  <span className="dot" />
                </div>
                <div className="icon-wrapper">
                  <ChevronRight />
                </div>
                <div className="dots">
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </ScrollNavButton>
            </KanbanWrapper>

            <DragOverlay>
              {activeAppointment && (
                <DragOverlayCard>
                  <KanbanCardHeader>
                    <KanbanAvatar>
                      {getInitials(activeAppointment.patient?.first_name, activeAppointment.patient?.last_name)}
                    </KanbanAvatar>
                    <KanbanPatientInfo>
                      <div className="name">
                        {activeAppointment.patient?.first_name} {activeAppointment.patient?.last_name}
                      </div>
                      <div className="type">{formatType(activeAppointment.type)}</div>
                    </KanbanPatientInfo>
                  </KanbanCardHeader>
                  <KanbanCardDetails>
                    <div className="detail">
                      <Calendar />
                      <span>{formatDate(activeAppointment.scheduled_at)}</span>
                    </div>
                    <div className="detail">
                      <Clock />
                      <span>{formatTime(activeAppointment.scheduled_at)}</span>
                    </div>
                  </KanbanCardDetails>
                </DragOverlayCard>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </PageWrapper>
    </AdminLayout>
  );
};

export default AdminAppointmentsPage;
