/**
 * Hook para notificações WhatsApp em páginas admin
 *
 * COMO USAR:
 *
 * const { sendConfirmation, sendRejection, isConnected, checkConnection } = useWhatsAppNotifications();
 *
 * // Ao confirmar consulta
 * const result = await sendConfirmation({
 *   patientName: 'Maria Silva',
 *   patientPhone: '11999999999',
 *   providerName: 'Dr. João',
 *   appointmentType: 'Consulta Inicial',
 *   appointmentDate: '10/02/2026',
 *   appointmentTime: '14:00',
 *   appointmentId: 'uuid-aqui'
 * });
 */

import { useState, useEffect, useCallback } from 'react';
import { whatsappService, AppointmentNotificationData, SendMessageResult } from '../../lib/whatsappService';

interface UseWhatsAppNotificationsReturn {
  // Status
  isConnected: boolean;
  isLoading: boolean;
  instanceName: string | null;
  instancePhone: string | null;

  // Ações
  checkConnection: () => Promise<boolean>;
  sendConfirmation: (data: AppointmentNotificationData) => Promise<SendMessageResult>;
  sendRejection: (data: AppointmentNotificationData & { reason: string }) => Promise<SendMessageResult>;
  sendCancellation: (data: AppointmentNotificationData & { reason: string }) => Promise<SendMessageResult>;
  sendReminder: (data: AppointmentNotificationData, type: '24h' | '1h') => Promise<SendMessageResult>;
  sendCustomMessage: (phone: string, message: string, appointmentId?: string) => Promise<SendMessageResult>;
}

export function useWhatsAppNotifications(): UseWhatsAppNotificationsReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [instancePhone, setInstancePhone] = useState<string | null>(null);

  // Verifica conexão WhatsApp
  const checkConnection = useCallback(async (): Promise<boolean> => {
    console.log('[useWhatsAppNotifications] Verificando conexão...');
    setIsLoading(true);

    try {
      const instance = await whatsappService.getConnectedInstance();

      if (instance) {
        setIsConnected(true);
        setInstanceName(instance.name);
        setInstancePhone(instance.phoneNumber || null);
        console.log('[useWhatsAppNotifications] Conectado:', instance.name);
        return true;
      } else {
        setIsConnected(false);
        setInstanceName(null);
        setInstancePhone(null);
        console.log('[useWhatsAppNotifications] Não conectado');
        return false;
      }
    } catch (error) {
      console.error('[useWhatsAppNotifications] Erro ao verificar conexão:', error);
      setIsConnected(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verifica conexão na montagem
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Enviar confirmação
  const sendConfirmation = useCallback(async (data: AppointmentNotificationData): Promise<SendMessageResult> => {
    console.log('[useWhatsAppNotifications] Enviando confirmação:', data);

    if (!isConnected) {
      console.warn('[useWhatsAppNotifications] WhatsApp não conectado, tentando reconectar...');
      const connected = await checkConnection();
      if (!connected) {
        return { success: false, error: 'WhatsApp não conectado' };
      }
    }

    return whatsappService.notifyAppointmentConfirmed(data);
  }, [isConnected, checkConnection]);

  // Enviar rejeição
  const sendRejection = useCallback(async (data: AppointmentNotificationData & { reason: string }): Promise<SendMessageResult> => {
    console.log('[useWhatsAppNotifications] Enviando rejeição:', data);

    if (!isConnected) {
      const connected = await checkConnection();
      if (!connected) {
        return { success: false, error: 'WhatsApp não conectado' };
      }
    }

    return whatsappService.notifyAppointmentRejected(data);
  }, [isConnected, checkConnection]);

  // Enviar cancelamento
  const sendCancellation = useCallback(async (data: AppointmentNotificationData & { reason: string }): Promise<SendMessageResult> => {
    console.log('[useWhatsAppNotifications] Enviando cancelamento:', data);

    if (!isConnected) {
      const connected = await checkConnection();
      if (!connected) {
        return { success: false, error: 'WhatsApp não conectado' };
      }
    }

    return whatsappService.notifyAppointmentCancelled(data);
  }, [isConnected, checkConnection]);

  // Enviar lembrete
  const sendReminder = useCallback(async (data: AppointmentNotificationData, type: '24h' | '1h'): Promise<SendMessageResult> => {
    console.log(`[useWhatsAppNotifications] Enviando lembrete ${type}:`, data);

    if (!isConnected) {
      const connected = await checkConnection();
      if (!connected) {
        return { success: false, error: 'WhatsApp não conectado' };
      }
    }

    return whatsappService.sendReminder(data, type);
  }, [isConnected, checkConnection]);

  // Enviar mensagem customizada
  const sendCustomMessage = useCallback(async (
    phone: string,
    message: string,
    appointmentId?: string
  ): Promise<SendMessageResult> => {
    console.log('[useWhatsAppNotifications] Enviando mensagem customizada:', { phone, message });

    if (!isConnected || !instanceName) {
      const connected = await checkConnection();
      if (!connected) {
        return { success: false, error: 'WhatsApp não conectado' };
      }
    }

    return whatsappService.sendText(instanceName!, phone, message, { appointmentId });
  }, [isConnected, instanceName, checkConnection]);

  return {
    isConnected,
    isLoading,
    instanceName,
    instancePhone,
    checkConnection,
    sendConfirmation,
    sendRejection,
    sendCancellation,
    sendReminder,
    sendCustomMessage,
  };
}

export default useWhatsAppNotifications;
