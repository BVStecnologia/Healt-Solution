# Sistema de Gestão de Clínica - Etapas do Projeto

**Cliente:** Essence Medical Clinic
**Início:** 04/02/2026
**Previsão de entrega (MVP):** 1 semana

---

## FASE 1: Infraestrutura e Setup (Dia 1) ✅

### Descrição para Tracker
> Configuração completa da infraestrutura de desenvolvimento em Docker, incluindo instalação e configuração do Supabase (PostgreSQL, Auth, Storage, API REST, Studio Dashboard) e Evolution API (WhatsApp Business). Setup de ambiente local containerizado pronto para desenvolvimento e futura migração para VPS.

### Tarefas Realizadas
- [x] Criação da estrutura do projeto
- [x] Configuração do Docker Compose para Supabase (13 serviços)
- [x] Configuração do Docker Compose para Evolution API (3 serviços)
- [x] Setup de variáveis de ambiente (.env)
- [x] Configuração de rede Docker entre serviços
- [x] Teste de conectividade entre containers
- [x] Criação de tabela de teste para validação
- [x] Documentação dos requisitos do cliente

### Entregáveis
- Stack Supabase funcionando (DB, Auth, API, Studio)
- Stack Evolution funcionando (WhatsApp API)
- Ambiente de desenvolvimento pronto

---

## FASE 2: Modelagem de Dados (Dia 2)

### Descrição para Tracker
> Criação do schema completo do banco de dados incluindo tabelas de pacientes, agendamentos, serviços, profissionais, automações e comunicações. Implementação de Row Level Security (RLS) para controle de acesso. Definição de relacionamentos e constraints.

### Tarefas Planejadas
- [ ] Tabela `pacientes` (dados pessoais, tipo, status)
- [ ] Tabela `profissionais` (médicos, staff)
- [ ] Tabela `servicos` (consultas, procedimentos, preços)
- [ ] Tabela `agendamentos` (data, hora, status, depósito)
- [ ] Tabela `comunicacoes` (histórico WhatsApp/Email)
- [ ] Tabela `automacoes` (regras de follow-up)
- [ ] Configuração de RLS (segurança por usuário)
- [ ] Seeds com dados de exemplo

### Entregáveis
- Schema completo do banco de dados
- Políticas de segurança configuradas
- Dados de teste populados

---

## FASE 3: Backend - APIs e Webhooks (Dias 2-3)

### Descrição para Tracker
> Desenvolvimento das APIs necessárias para o sistema, incluindo endpoints de agendamento, integração com Evolution API para envio/recebimento de mensagens WhatsApp, e configuração de webhooks para automações em tempo real.

### Tarefas Planejadas
- [ ] API de agendamentos (CRUD)
- [ ] API de pacientes (CRUD)
- [ ] Integração Supabase ↔ Evolution API
- [ ] Webhook para receber mensagens WhatsApp
- [ ] Webhook para status de mensagens
- [ ] Funções de automação (Edge Functions)
- [ ] Lógica de elegibilidade para agendamentos

### Entregáveis
- APIs REST funcionais
- Integração WhatsApp operacional
- Sistema de webhooks configurado

---

## FASE 4: Frontend - Painel da Clínica (Dias 3-4)

### Descrição para Tracker
> Desenvolvimento do painel administrativo da clínica utilizando React/Next.js com interface para gerenciamento de agendamentos, visualização de calendário, cadastro de pacientes, e dashboard com métricas. Interface responsiva e intuitiva.

### Tarefas Planejadas
- [ ] Setup do projeto Next.js
- [ ] Layout base (sidebar, header, navegação)
- [ ] Dashboard com métricas principais
- [ ] Tela de calendário/agenda (visualização diária/semanal)
- [ ] Tela de listagem de pacientes
- [ ] Tela de detalhes do paciente
- [ ] Formulário de novo agendamento
- [ ] Integração com Supabase (auth + data)

### Entregáveis
- Painel administrativo funcional
- Calendário interativo
- CRUD de pacientes e agendamentos

---

## FASE 5: Sistema de Notificações WhatsApp (Dias 4-5)

### Descrição para Tracker
> Implementação do sistema de notificações automatizadas via WhatsApp incluindo confirmação de consultas, lembretes 24h antes, follow-up pós-consulta, e mensagens de reagendamento. Suporte bilíngue (Português/Inglês).

### Tarefas Planejadas
- [ ] Templates de mensagens (PT/EN)
- [ ] Confirmação automática de agendamento
- [ ] Lembrete 24h antes da consulta
- [ ] Lembrete 1h antes da consulta
- [ ] Mensagem de follow-up pós-consulta
- [ ] Notificação de cancelamento
- [ ] Interface para gerenciar templates
- [ ] Logs de mensagens enviadas

### Entregáveis
- Sistema de notificações automatizado
- Templates configuráveis
- Histórico de comunicações

---

## FASE 6: Testes e Refinamentos (Dias 5-6)

### Descrição para Tracker
> Testes completos do sistema, correção de bugs, otimização de performance, e refinamentos na interface do usuário. Validação de todos os fluxos de agendamento e notificação.

### Tarefas Planejadas
- [ ] Testes de fluxo completo de agendamento
- [ ] Testes de envio de WhatsApp
- [ ] Testes de automações
- [ ] Correção de bugs identificados
- [ ] Otimização de queries
- [ ] Melhorias de UX/UI
- [ ] Documentação de uso

### Entregáveis
- Sistema testado e funcional
- Bugs corrigidos
- Documentação básica

---

## FASE 7: Deploy em VPS (Dia 7)

### Descrição para Tracker
> Migração do sistema para servidor de produção (VPS), configuração de domínios, certificados SSL, proxy reverso Nginx, e setup do Portainer para gerenciamento dos containers. Testes finais em ambiente de produção.

### Tarefas Planejadas
- [ ] Preparar .env de produção
- [ ] Configurar Nginx + SSL (Let's Encrypt)
- [ ] Deploy das stacks Docker
- [ ] Configurar domínios
- [ ] Setup do Portainer
- [ ] Migrar dados de teste
- [ ] Testes em produção
- [ ] Handoff para cliente

### Entregáveis
- Sistema em produção
- SSL configurado
- Portainer funcionando
- Documentação de acesso

---

## Resumo de Horas por Fase

| Fase | Descrição | Horas Est. |
|------|-----------|------------|
| 1 | Infraestrutura e Setup | 4h |
| 2 | Modelagem de Dados | 3h |
| 3 | Backend - APIs | 6h |
| 4 | Frontend - Painel | 8h |
| 5 | Notificações WhatsApp | 5h |
| 6 | Testes e Refinamentos | 4h |
| 7 | Deploy em VPS | 3h |
| **TOTAL** | | **33h** |

---

## Tecnologias Utilizadas

- **Containerização:** Docker, Docker Compose
- **Banco de Dados:** PostgreSQL 15 (via Supabase)
- **Backend:** Supabase (Auth, Storage, Edge Functions, Realtime)
- **API WhatsApp:** Evolution API v2.2.3
- **Frontend:** Next.js 14, React 18, TailwindCSS
- **Proxy/SSL:** Nginx, Let's Encrypt
- **Gerenciamento:** Portainer

---

## Contato

Para dúvidas ou atualizações sobre o progresso, entre em contato.

*Última atualização: 04/02/2026*
