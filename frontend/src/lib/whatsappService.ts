/**
 * WhatsApp Service - Evolution API
 *
 * Serviço para envio de mensagens WhatsApp via Evolution API.
 * Suporta múltiplos idiomas (PT/EN) baseado na preferência do paciente.
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
 * // Enviar mensagem usando template (com idioma)
 * const result = await whatsappService.sendFromTemplate(
 *   instance.name,
 *   '5511999999999',
 *   'appointment_confirmed',
 *   { nome: 'Maria', medico: 'Dr. João', data: '10/02', hora: '14:00', tipo: 'Consulta Inicial' },
 *   'pt'  // ou 'en' para inglês
 * );
 *
 * // Ou usar função de conveniência
 * const result = await whatsappService.notifyAppointmentConfirmed({
 *   patientName: 'Maria',
 *   patientPhone: '5511999999999',
 *   providerName: 'Dr. João',
 *   appointmentType: 'Consulta Inicial',
 *   appointmentDate: '10/02/2026',
 *   appointmentTime: '14:00',
 *   language: 'en',  // Idioma do paciente
 * });
 */

import { supabase } from './supabaseClient';

// Configuração da Evolution API
const EVOLUTION_API_URL = process.env.REACT_APP_EVOLUTION_API_URL || 'http://localhost:8082';
const EVOLUTION_API_KEY = process.env.REACT_APP_EVOLUTION_API_KEY || 'sua_chave_evolution_aqui';

// Debug mode - ativa logs detalhados
const DEBUG = true;

// Idiomas suportados
export type SupportedLanguage = 'pt' | 'en';
const DEFAULT_LANGUAGE: SupportedLanguage = 'pt';

// NÚMEROS DE TESTE - Em desenvolvimento, só envia WhatsApp para esses números
// Para desabilitar essa restrição, defina REACT_APP_WHATSAPP_ALLOW_ALL=true
const TEST_PHONE_NUMBERS = [
  '5548998384402',  // Número de teste 1
  '554831971656',   // Número de teste 2
];

const ALLOW_ALL_NUMBERS = process.env.REACT_APP_WHATSAPP_ALLOW_ALL === 'true';

function isAllowedPhoneNumber(phone: string): boolean {
  if (ALLOW_ALL_NUMBERS) return true;

  // Remove caracteres não numéricos para comparação
  const cleanPhone = phone.replace(/\D/g, '');
  return TEST_PHONE_NUMBERS.some(testPhone =>
    cleanPhone.includes(testPhone) || testPhone.includes(cleanPhone)
  );
}

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
  language: string;
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
    language?: SupportedLanguage;
  }
): Promise<SendMessageResult> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Validação de número de teste (em desenvolvimento)
  if (!isAllowedPhoneNumber(formattedPhone)) {
    log(`BLOQUEADO: Número ${formattedPhone} não está na lista de teste. Mensagem não enviada.`);
    return {
      success: false,
      error: `Número ${formattedPhone} não está autorizado para receber mensagens de teste.`,
    };
  }

  log('Enviando mensagem:', {
    instance: instanceName,
    phone: formattedPhone,
    language: options?.language || DEFAULT_LANGUAGE,
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
        language: options?.language || DEFAULT_LANGUAGE,
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
      language: options?.language || DEFAULT_LANGUAGE,
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
      language: options?.language || DEFAULT_LANGUAGE,
    });

    return {
      success: false,
      error: error.message || 'Erro ao enviar mensagem',
    };
  }
}

/**
 * Busca template de mensagem pelo nome e idioma
 * Se não encontrar no idioma solicitado, faz fallback para português
 */
async function getTemplate(
  templateName: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): Promise<MessageTemplate | null> {
  log(`Buscando template: ${templateName} (${language})`);

  try {
    // Primeiro tenta buscar no idioma solicitado
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('name', templateName)
      .eq('language', language)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Se não encontrou e o idioma não é PT, tenta fallback para PT
      if (language !== 'pt') {
        log(`Template não encontrado em ${language}, tentando fallback para PT...`);
        return getTemplate(templateName, 'pt');
      }

      logError('Template não encontrado', error);
      return null;
    }

    log('Template encontrado:', { name: data.name, language: data.language });
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
 * @param instanceName - Nome da instância WhatsApp
 * @param phoneNumber - Número do destinatário
 * @param templateName - Nome do template (ex: 'appointment_confirmed')
 * @param variables - Variáveis para substituir no template
 * @param language - Idioma do template ('pt' ou 'en')
 * @param options - Opções adicionais (appointmentId, patientId)
 */
async function sendFromTemplate(
  instanceName: string,
  phoneNumber: string,
  templateName: string,
  variables: Record<string, string>,
  language: SupportedLanguage = DEFAULT_LANGUAGE,
  options?: {
    appointmentId?: string;
    patientId?: string;
  }
): Promise<SendMessageResult> {
  log('Enviando mensagem com template:', { templateName, language, variables });

  const template = await getTemplate(templateName, language);
  if (!template) {
    return {
      success: false,
      error: `Template "${templateName}" não encontrado para idioma "${language}"`,
    };
  }

  const message = applyTemplateVariables(template.content, variables);

  return sendText(instanceName, phoneNumber, message, {
    ...options,
    templateName,
    language,
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
  language?: SupportedLanguage;
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
      p_language: params.language || DEFAULT_LANGUAGE,
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

/**
 * Busca idioma preferido do paciente no banco
 */
async function getPatientLanguage(patientId: string): Promise<SupportedLanguage> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('preferred_language')
      .eq('id', patientId)
      .single();

    if (error || !data?.preferred_language) {
      log(`Idioma não encontrado para paciente ${patientId}, usando padrão: ${DEFAULT_LANGUAGE}`);
      return DEFAULT_LANGUAGE;
    }

    const lang = data.preferred_language as SupportedLanguage;
    log(`Idioma do paciente ${patientId}: ${lang}`);
    return lang;
  } catch (error) {
    logError('Erro ao buscar idioma do paciente', error);
    return DEFAULT_LANGUAGE;
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
  appointmentDate: string;  // formato: "10/02/2026" ou "02/10/2026" dependendo do idioma
  appointmentTime: string;  // formato: "14:00" ou "2:00 PM"
  appointmentId?: string;
  language?: SupportedLanguage;  // Idioma preferido do paciente
}

/**
 * Notifica paciente sobre confirmação de consulta
 */
async function notifyAppointmentConfirmed(
  data: AppointmentNotificationData
): Promise<SendMessageResult> {
  // Se não foi passado idioma mas temos patientId, busca do banco
  let language = data.language || DEFAULT_LANGUAGE;
  if (!data.language && data.patientId) {
    language = await getPatientLanguage(data.patientId);
  }

  log(`Notificando confirmação de consulta (${language}):`, data);

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
    language,
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
  // Se não foi passado idioma mas temos patientId, busca do banco
  let language = data.language || DEFAULT_LANGUAGE;
  if (!data.language && data.patientId) {
    language = await getPatientLanguage(data.patientId);
  }

  log(`Notificando rejeição de consulta (${language}):`, data);

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
    language,
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
  // Se não foi passado idioma mas temos patientId, busca do banco
  let language = data.language || DEFAULT_LANGUAGE;
  if (!data.language && data.patientId) {
    language = await getPatientLanguage(data.patientId);
  }

  log(`Notificando cancelamento de consulta (${language}):`, data);

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
    language,
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
  // Se não foi passado idioma mas temos patientId, busca do banco
  let language = data.language || DEFAULT_LANGUAGE;
  if (!data.language && data.patientId) {
    language = await getPatientLanguage(data.patientId);
  }

  log(`Enviando lembrete ${type} (${language}):`, data);

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
    language,
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
  getPatientLanguage,
};

export default whatsappService;
