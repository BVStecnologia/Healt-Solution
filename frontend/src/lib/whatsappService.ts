/**
 * WhatsApp Service - Evolution API
 *
 * Serviço simples para envio de mensagens WhatsApp via Evolution API.
 * Inclui logs detalhados para facilitar debug.
 *
 * COMO USAR:
 *
 * import { whatsappService } from '../lib/whatsappService';
 *
 * // Verificar se há instância conectada
 * const instance = await whatsappService.getConnectedInstance();
 * if (!instance) {
 *   console.log('Nenhuma instância WhatsApp conectada');
 *   return;
 * }
 *
 * // Enviar mensagem simples
 * const result = await whatsappService.sendText(
 *   instance.name,
 *   '5511999999999',
 *   'Olá! Sua consulta foi confirmada.'
 * );
 *
 * // Ou usar template
 * const result = await whatsappService.sendFromTemplate(
 *   instance.name,
 *   '5511999999999',
 *   'appointment_confirmed',
 *   { nome: 'Maria', medico: 'Dr. João', data: '10/02', hora: '14:00', tipo: 'Consulta Inicial' }
 * );
 */

import { supabase } from './supabaseClient';

// Configuração da Evolution API
const EVOLUTION_API_URL = process.env.REACT_APP_EVOLUTION_API_URL || 'http://localhost:8082';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY || '';

// Debug mode - ativa logs detalhados
const DEBUG = true;

function log(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[WhatsApp] ${message}`, data || '');
  }
}

function logError(message: string, error?: any) {
  console.error(`[WhatsApp ERROR] ${message}`, error || '');
}

// Types
export interface WhatsAppInstance {
  id?: string;
  name: string;
  instanceName?: string;
  state?: string;
  connectionStatus?: string;
  phoneNumber?: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  logId?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

// =============================================
// FUNÇÕES PRINCIPAIS
// =============================================

/**
 * Busca a primeira instância WhatsApp conectada
 */
async function getConnectedInstance(): Promise<WhatsAppInstance | null> {
  log('Buscando instância conectada...');

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': EVOLUTION_API_KEY,
      },
    });

    if (!response.ok) {
      logError('Erro ao buscar instâncias', response.status);
      return null;
    }

    const instances = await response.json();
    log('Instâncias encontradas:', instances);

    // Encontrar instância conectada
    const connected = instances.find((inst: any) =>
      inst.connectionStatus === 'open' || inst.state === 'open'
    );

    if (connected) {
      const instance: WhatsAppInstance = {
        name: connected.name || connected.instanceName,
        instanceName: connected.instanceName,
        state: connected.state || connected.connectionStatus,
      };

      // Buscar número conectado
      try {
        const detailResponse = await fetch(
          `${EVOLUTION_API_URL}/instance/connectionState/${instance.name}`,
          { headers: { 'apikey': EVOLUTION_API_KEY } }
        );
        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          instance.phoneNumber = detail.instance?.user?.id?.replace('@s.whatsapp.net', '') || null;
        }
      } catch (e) {
        log('Não foi possível obter número', e);
      }

      log('Instância conectada:', instance);
      return instance;
    }

    log('Nenhuma instância conectada');
    return null;
  } catch (error) {
    logError('Erro ao buscar instâncias', error);
    return null;
  }
}

/**
 * Formata número de telefone para o padrão WhatsApp
 * Aceita: 11999999999, (11) 99999-9999, +55 11 99999-9999, etc
 * Retorna: 5511999999999
 */
function formatPhoneNumber(phone: string): string {
  // Remove tudo que não é número
  let cleaned = phone.replace(/\D/g, '');

  // Se começar com 0, remove
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Se não começar com 55, adiciona
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }

  log(`Número formatado: ${phone} -> ${cleaned}`);
  return cleaned;
}

/**
 * Envia mensagem de texto simples
 */
async function sendText(
  instanceName: string,
  phoneNumber: string,
  message: string,
  options?: {
    appointmentId?: string;
    patientId?: string;
    templateName?: string;
  }
): Promise<SendMessageResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  log('Enviando mensagem:', {
    instance: instanceName,
    phone: formattedPhone,
    message: message.substring(0, 50) + '...',
  });

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });

    const data = await response.json();
    log('Resposta Evolution API:', data);

    if (!response.ok) {
      logError('Erro ao enviar mensagem', data);

      // Logar erro no banco
      await logMessageToDatabase({
        phoneNumber: formattedPhone,
        message,
        status: 'failed',
        error: data.message || 'Erro desconhecido',
        appointmentId: options?.appointmentId,
        patientId: options?.patientId,
        templateName: options?.templateName,
      });

      return {
        success: false,
        error: data.message || 'Erro ao enviar mensagem',
      };
    }

    // Extrair messageId da resposta
    const messageId = data.key?.id || data.messageId || data.id;

    // Logar sucesso no banco
    const logId = await logMessageToDatabase({
      phoneNumber: formattedPhone,
      message,
      status: 'sent',
      evolutionMessageId: messageId,
      appointmentId: options?.appointmentId,
      patientId: options?.patientId,
      templateName: options?.templateName,
      metadata: data,
    });

    log('Mensagem enviada com sucesso!', { messageId, logId });

    return {
      success: true,
      messageId,
      logId,
    };
  } catch (error: any) {
    logError('Exceção ao enviar mensagem', error);

    // Logar erro no banco
    await logMessageToDatabase({
      phoneNumber: formattedPhone,
      message,
      status: 'failed',
      error: error.message || 'Exceção desconhecida',
      appointmentId: options?.appointmentId,
      patientId: options?.patientId,
      templateName: options?.templateName,
    });

    return {
      success: false,
      error: error.message || 'Erro ao enviar mensagem',
    };
  }
}

/**
 * Busca template de mensagem pelo nome
 */
async function getTemplate(templateName: string): Promise<MessageTemplate | null> {
  log('Buscando template:', templateName);

  try {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('name', templateName)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      logError('Template não encontrado', error);
      return null;
    }

    log('Template encontrado:', data);
    return data as MessageTemplate;
  } catch (error) {
    logError('Erro ao buscar template', error);
    return null;
  }
}

/**
 * Aplica variáveis ao template
 */
function applyTemplateVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }

  log('Template processado:', result.substring(0, 100) + '...');
  return result;
}

/**
 * Envia mensagem usando template
 */
async function sendFromTemplate(
  instanceName: string,
  phoneNumber: string,
  templateName: string,
  variables: Record<string, string>,
  options?: {
    appointmentId?: string;
    patientId?: string;
  }
): Promise<SendMessageResult> {
  log('Enviando mensagem com template:', { templateName, variables });

  const template = await getTemplate(templateName);
  if (!template) {
    return {
      success: false,
      error: `Template "${templateName}" não encontrado`,
    };
  }

  const message = applyTemplateVariables(template.content, variables);

  return sendText(instanceName, phoneNumber, message, {
    ...options,
    templateName,
  });
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

interface LogMessageParams {
  instanceId?: string;
  appointmentId?: string;
  patientId?: string;
  templateName?: string;
  phoneNumber: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  evolutionMessageId?: string;
  error?: string;
  metadata?: any;
}

/**
 * Registra mensagem no banco de dados
 */
async function logMessageToDatabase(params: LogMessageParams): Promise<string | undefined> {
  try {
    const { data, error } = await supabase.rpc('log_whatsapp_message', {
      p_instance_id: params.instanceId || null,
      p_appointment_id: params.appointmentId || null,
      p_patient_id: params.patientId || null,
      p_template_name: params.templateName || null,
      p_phone_number: params.phoneNumber,
      p_message: params.message,
      p_status: params.status,
      p_evolution_message_id: params.evolutionMessageId || null,
      p_metadata: params.error
        ? { error: params.error, ...params.metadata }
        : params.metadata || null,
    });

    if (error) {
      logError('Erro ao logar mensagem no banco', error);
      return undefined;
    }

    log('Mensagem logada no banco:', data);
    return data as string;
  } catch (error) {
    logError('Exceção ao logar mensagem', error);
    return undefined;
  }
}

// =============================================
// FUNÇÕES DE CONVENIÊNCIA PARA AGENDAMENTOS
// =============================================

export interface AppointmentNotificationData {
  patientName: string;
  patientPhone: string;
  patientId?: string;
  providerName: string;
  appointmentType: string;
  appointmentDate: string;  // formato: "10/02/2026"
  appointmentTime: string;  // formato: "14:00"
  appointmentId?: string;
}

/**
 * Notifica paciente sobre confirmação de consulta
 */
async function notifyAppointmentConfirmed(
  data: AppointmentNotificationData
): Promise<SendMessageResult> {
  log('Notificando confirmação de consulta:', data);

  const instance = await getConnectedInstance();
  if (!instance) {
    logError('Nenhuma instância WhatsApp conectada para enviar notificação');
    return { success: false, error: 'WhatsApp não conectado' };
  }

  return sendFromTemplate(
    instance.name,
    data.patientPhone,
    'appointment_confirmed',
    {
      nome: data.patientName,
      medico: data.providerName,
      tipo: data.appointmentType,
      data: data.appointmentDate,
      hora: data.appointmentTime,
    },
    {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
    }
  );
}

/**
 * Notifica paciente sobre rejeição de consulta
 */
async function notifyAppointmentRejected(
  data: AppointmentNotificationData & { reason: string }
): Promise<SendMessageResult> {
  log('Notificando rejeição de consulta:', data);

  const instance = await getConnectedInstance();
  if (!instance) {
    logError('Nenhuma instância WhatsApp conectada para enviar notificação');
    return { success: false, error: 'WhatsApp não conectado' };
  }

  return sendFromTemplate(
    instance.name,
    data.patientPhone,
    'appointment_rejected',
    {
      nome: data.patientName,
      motivo: data.reason,
    },
    {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
    }
  );
}

/**
 * Notifica paciente sobre cancelamento de consulta
 */
async function notifyAppointmentCancelled(
  data: AppointmentNotificationData & { reason: string }
): Promise<SendMessageResult> {
  log('Notificando cancelamento de consulta:', data);

  const instance = await getConnectedInstance();
  if (!instance) {
    logError('Nenhuma instância WhatsApp conectada para enviar notificação');
    return { success: false, error: 'WhatsApp não conectado' };
  }

  return sendFromTemplate(
    instance.name,
    data.patientPhone,
    'appointment_cancelled',
    {
      nome: data.patientName,
      medico: data.providerName,
      data: data.appointmentDate,
      hora: data.appointmentTime,
      motivo: data.reason,
    },
    {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
    }
  );
}

/**
 * Envia lembrete de consulta
 */
async function sendReminder(
  data: AppointmentNotificationData,
  type: '24h' | '1h'
): Promise<SendMessageResult> {
  log(`Enviando lembrete ${type}:`, data);

  const instance = await getConnectedInstance();
  if (!instance) {
    logError('Nenhuma instância WhatsApp conectada para enviar lembrete');
    return { success: false, error: 'WhatsApp não conectado' };
  }

  const templateName = type === '24h' ? 'reminder_24h' : 'reminder_1h';
  const variables: Record<string, string> = type === '24h'
    ? {
        nome: data.patientName,
        medico: data.providerName,
        tipo: data.appointmentType,
        data: data.appointmentDate,
        hora: data.appointmentTime,
      }
    : {
        medico: data.providerName,
        hora: data.appointmentTime,
      };

  return sendFromTemplate(
    instance.name,
    data.patientPhone,
    templateName,
    variables,
    {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
    }
  );
}

// =============================================
// EXPORT
// =============================================

export const whatsappService = {
  // Funções básicas
  getConnectedInstance,
  formatPhoneNumber,
  sendText,
  getTemplate,
  sendFromTemplate,

  // Funções de conveniência
  notifyAppointmentConfirmed,
  notifyAppointmentRejected,
  notifyAppointmentCancelled,
  sendReminder,

  // Utilitários
  logMessageToDatabase,
};

export default whatsappService;
