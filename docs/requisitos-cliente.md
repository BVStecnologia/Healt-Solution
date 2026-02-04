# Requisitos do Cliente - Sistema de Gestão de Clínica

## Visão Geral

Sistema automatizado de comunicação e gestão de pacientes que reduz trabalho administrativo manual, preservando controle clínico e de agendamento.

---

## 1. Sistema de Agendamento e Follow-up

### Situação Atual
- EMR atual: **OptiMantra**
- Pacientes registrados manualmente devido ao fluxo de depósitos e agendamento
- Controle manual é importante, mas precisa de automação

### Requisitos
- Follow-ups automáticos com pacientes
- Agendamento automático de consultas elegíveis
- Fluxos de comunicação diferentes baseados em:
  - Tipo de paciente
  - Plano de tratamento
- Confirmações de consulta automatizadas
- Gestão de depósitos

---

## 2. Portal do Paciente

### Após Consulta Inicial
- Paciente recebe plano personalizado com:
  - Serviços recomendados
  - Exames laboratoriais
  - Suplementos

### Funcionalidades do Portal
- [ ] Visualizar recomendações personalizadas
- [ ] Comprar produtos e serviços aprovados
- [ ] Agendar consultas (dentro de critérios clínicos predefinidos)
- [ ] Visualizar prescrições
- [ ] Histórico de consultas
- [ ] Solicitar serviços adicionais:
  - Aconselhamento nutricional
  - Personal training
  - Health coaching
  - Terapia

### Regras de Negócio - Exemplo TRT/Hormônios
- Pacientes em terapia hormonal/TRT devem:
  - Completar exames laboratoriais obrigatórios
  - Ter pelo menos 1 visita ao médico a cada 6 meses
  - Só então são elegíveis para refills ou continuação do tratamento

---

## 3. Vendas e Upsells Inteligentes

### Objetivo
- Facilitar vendas alinhadas ao plano de cuidados do paciente
- Sistema escalável de agendamento automatizado
- Nutrir pacientes para engajamento de longo prazo

### Funcionalidades
- Apresentar serviços add-on relevantes
- Programas de follow-up
- Memberships/assinaturas
- Terapias de suporte
- Timing apropriado na jornada do paciente
- Sem intervenção manual da equipe

---

## 4. Documentação Clínica

### Situação Atual
- Prontuários feitos manualmente
- AI Scribe atual: **Plaud**
- Processo requer copiar/colar notas no EMR

### Requisitos
- Integrar notas geradas por IA diretamente no prontuário
- Eliminar fricção do copy/paste
- Manter:
  - Precisão
  - Compliance
  - Integridade clínica

---

## 5. Comunicação com IA

### Requisitos
- Modelo de comunicação treinado com IA para:
  - Responder perguntas frequentes dos pacientes
  - Guiar pacientes pelos próximos passos
  - Redirecionar questões fora do escopo para departamento apropriado

---

## 6. Objetivos Gerais

- [ ] Automatizar completamente comunicações com pacientes (onde apropriado)
- [ ] Melhorar experiência do paciente
- [ ] Aumentar retenção
- [ ] Aumentar lifetime value (LTV)
- [ ] Liberar tempo da equipe da clínica

---

## Integrações Necessárias

| Sistema | Função |
|---------|--------|
| OptiMantra | EMR atual |
| Plaud | AI Scribe |
| Portal (a desenvolver) | Acesso do paciente |
| Sistema de pagamentos | Depósitos e compras |
| Sistema de comunicação | SMS/Email/WhatsApp |

---

*Documento criado em: 03/02/2026*
