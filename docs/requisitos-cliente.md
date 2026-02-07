# Requisitos do Cliente - Essence Medical Clinic

## Visão Geral

Sistema automatizado de comunicação e gestão de pacientes que reduz trabalho administrativo manual, preservando controle clínico e de agendamento.

**Cliente:** Shapeup Health Solutions (Essence Medical Clinic)
**EMR atual:** OptiMantra (sem API pública — apenas outbound webhooks)
**AI Scribe:** Plaud (áudio → texto)

---

## Pilar 1: Comunicação Automatizada com Pacientes

### Situação Atual
- EMR atual: **OptiMantra**
- Pacientes registrados manualmente devido ao fluxo de depósitos e agendamento
- Controle manual é importante, mas precisa de automação

### Requisitos
- Follow-ups automáticos com pacientes
- Agendamento automático de consultas elegíveis
- Fluxos de comunicação diferentes baseados em:
  - Tipo de paciente (wellness, BHRT, rejuvenation, IV therapy, etc.)
  - Plano de tratamento
- Confirmações de consulta automatizadas
- Gestão de depósitos
- Nurturing sequences (follow-up pós-consulta em 7/30/90 dias)
- Multi-canal: WhatsApp + SMS + Email

---

## Pilar 2: Agendamento Inteligente com Depósitos

### Requisitos
- Portal de agendamento self-service
- Regras de elegibilidade por tipo de paciente
- Calendário admin com visões mês/semana/dia
- Múltiplos turnos por dia + bloqueios de agenda
- Sistema de depósitos (Stripe/Square)
- Waitlist para horários populares

### Regras de Negócio - Exemplo TRT/Hormônios
- Pacientes em terapia hormonal/TRT devem:
  - Completar exames laboratoriais obrigatórios
  - Ter pelo menos 1 visita ao médico a cada 6 meses
  - Só então são elegíveis para refills ou continuação do tratamento

---

## Pilar 3: Portal do Paciente com Compras e Critérios Clínicos

### Após Consulta Inicial
- Paciente recebe plano personalizado com:
  - Serviços recomendados
  - Exames laboratoriais
  - Suplementos

### Funcionalidades do Portal
- [ ] Login/cadastro (email + Google OAuth)
- [ ] Dashboard com próximas consultas
- [ ] Visualizar recomendações personalizadas
- [ ] Comprar produtos e serviços aprovados
- [ ] Agendar consultas (dentro de critérios clínicos predefinidos)
- [ ] Visualizar prescrições
- [ ] Histórico de consultas
- [ ] Upload/visualização de documentos (exames, planos, receitas)
- [ ] Mensagens com a clínica
- [ ] Pagamentos online
- [ ] Solicitar serviços adicionais:
  - Aconselhamento nutricional
  - Personal training
  - Health coaching
  - Terapia

---

## Pilar 4: Motor de Vendas e Upsells Inteligentes

### Objetivo
- Facilitar vendas alinhadas ao plano de cuidados do paciente
- Sistema escalável de agendamento automatizado
- Nutrir pacientes para engajamento de longo prazo

### Funcionalidades
- Apresentar serviços add-on relevantes (baseado no tipo/histórico)
- Pacotes de consultas (ex: 6 sessões Morpheus8)
- Programas de follow-up
- Memberships/assinaturas (planos mensais com benefícios)
- Terapias de suporte
- Timing apropriado na jornada do paciente (triggers automáticos)
- Sem intervenção manual da equipe

---

## Pilar 5: Documentação Clínica + AI Scribe

### Situação Atual
- Prontuários feitos manualmente
- AI Scribe atual: **Plaud** (grava áudio da consulta → transcrição)
- Processo requer copiar/colar notas no EMR (OptiMantra)

### Requisitos
- Upload e visualização de documentos (exames, planos, receitas, consentimentos)
- Integrar notas geradas por IA (Plaud) diretamente no prontuário
- Eliminar fricção do copy/paste
- Automação para inserir SOAP notes no OptiMantra (via browser, sem API)
- Manter: precisão, compliance, integridade clínica, audit trail

### Tipos de Documentos
| Tipo | Origem | Função |
|------|--------|--------|
| SOAP Notes | AI Scribe (Plaud) + médico | Prontuário da consulta |
| Lab Results | LabCorp/Quest → OptiMantra | Resultados de exames |
| Prescriptions | OptiMantra/SureScripts | Receitas médicas |
| Treatment Plans | Médico | Plano de tratamento personalizado |
| Consent Forms | Paciente assina | Consentimentos obrigatórios |
| Intake Forms | Paciente preenche | Formulário de admissão |
| Invoices | OptiMantra/Stripe | Faturas e recibos |

---

## Pilar 6: Modelo de Comunicação com IA

### Requisitos
- Modelo de comunicação treinado com IA (Claude API) para:
  - Responder perguntas frequentes dos pacientes
  - Guiar pacientes pelos próximos passos
  - Redirecionar questões fora do escopo para departamento apropriado
  - Conversação natural por WhatsApp
- Multi-canal: WhatsApp (principal), SMS (backup), Email (formal)

---

## Objetivos Gerais

- [ ] Automatizar completamente comunicações com pacientes (onde apropriado)
- [ ] Melhorar experiência do paciente
- [ ] Aumentar retenção
- [ ] Aumentar lifetime value (LTV)
- [ ] Liberar tempo da equipe da clínica

---

## Integrações Necessárias

| Sistema | Função | Status |
|---------|--------|--------|
| OptiMantra | EMR (prontuários, labs, prescrições) | Sem API — automação browser |
| Plaud | AI Scribe (áudio → SOAP notes) | Aguardando info |
| Stripe/Square | Pagamentos, depósitos | Não integrado |
| LabCorp/Quest | Resultados de exames (via OptiMantra) | Via OptiMantra |
| Evolution API | WhatsApp (mensagens, lembretes) | ✅ Integrado |
| Twilio | SMS (backup) | Planejado |
| Resend | Email (formal) | Planejado |
| Claude API | Chatbot IA | Planejado |
| SureScripts | e-Prescriptions (via OptiMantra) | Via OptiMantra |

---

*Documento atualizado em: 07/02/2026 (expandido com 6 pilares + análise OptiMantra)*
