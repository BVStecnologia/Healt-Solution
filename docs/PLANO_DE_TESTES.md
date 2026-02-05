# Plano de Testes - Essence Medical Clinic

**Versão:** 1.0
**Data:** 05/02/2026
**Escopo:** Sistema completo (Portal Paciente + Painel Admin)

---

## 1. Testes de Autenticação

### 1.1 Login do Paciente
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| AUTH-01 | Login com credenciais válidas | 1. Acessar /login<br>2. Inserir email/senha válidos<br>3. Clicar em Entrar | Redireciona para Dashboard |
| AUTH-02 | Login com senha incorreta | 1. Acessar /login<br>2. Inserir email válido e senha errada | Exibe mensagem de erro |
| AUTH-03 | Login com email inexistente | 1. Acessar /login<br>2. Inserir email não cadastrado | Exibe mensagem de erro |
| AUTH-04 | Login com Google OAuth | 1. Acessar /login<br>2. Clicar "Entrar com Google"<br>3. Autenticar no Google | Redireciona para Dashboard, profile atualizado |
| AUTH-05 | Toggle visibilidade senha | 1. Digitar senha<br>2. Clicar no ícone de olho | Senha visível/oculta alterna |
| AUTH-06 | Logout | 1. Estar logado<br>2. Clicar em Sair | Redireciona para /login, sessão encerrada |

### 1.2 Registro de Paciente
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| AUTH-07 | Registro com dados válidos | 1. Acessar /register<br>2. Preencher todos os campos<br>3. Submeter | Conta criada, profile tipo "new", redireciona login |
| AUTH-08 | Registro com senhas diferentes | 1. Preencher senha e confirmação diferentes | Exibe erro de validação |
| AUTH-09 | Registro com senha curta | 1. Preencher senha < 6 caracteres | Exibe erro de validação |
| AUTH-10 | Registro com email existente | 1. Usar email já cadastrado | Exibe erro "email já existe" |

### 1.3 Login do Admin
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| AUTH-11 | Login admin válido | 1. Acessar /admin/login<br>2. Inserir credenciais de admin | Redireciona para /admin |
| AUTH-12 | Login admin com conta paciente | 1. Usar credenciais de paciente em /admin/login | Exibe erro "não é administrador" |
| AUTH-13 | Acesso admin sem autenticação | 1. Acessar /admin diretamente | Redireciona para /admin/login |

---

## 2. Testes do Portal do Paciente

### 2.1 Dashboard
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| PAC-01 | Exibição de estatísticas | 1. Acessar Dashboard | Exibe: consultas agendadas, realizadas, total |
| PAC-02 | Lista de próximas consultas | 1. Ter consultas agendadas<br>2. Acessar Dashboard | Exibe até 3 próximas consultas |
| PAC-03 | Estado vazio | 1. Paciente sem consultas<br>2. Acessar Dashboard | Exibe CTA "Agendar primeira consulta" |
| PAC-04 | Saudação personalizada | 1. Acessar Dashboard | Exibe "Olá, [Nome do Paciente]" |

### 2.2 Agendamento de Consulta
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| PAC-05 | Fluxo completo de agendamento | 1. Clicar "Nova Consulta"<br>2. Selecionar tipo<br>3. Verificar elegibilidade<br>4. Selecionar médico<br>5. Selecionar data<br>6. Selecionar horário<br>7. Confirmar | Consulta criada, redireciona para detalhes |
| PAC-06 | Paciente "new" só initial_consultation | 1. Paciente tipo "new"<br>2. Tentar agendar "follow_up" | Bloqueado, exibe mensagem de elegibilidade |
| PAC-07 | Paciente TRT sem exames recentes | 1. Paciente TRT sem labs últimos 6 meses<br>2. Tentar agendar | Bloqueado, exibe requisitos |
| PAC-08 | Slots disponíveis | 1. Selecionar médico e data<br>2. Verificar slots | Exibe apenas horários disponíveis |
| PAC-09 | Mínimo 24h antecedência | 1. Tentar agendar para hoje | Não permite, exibe aviso |
| PAC-10 | Máximo 1 consulta/dia | 1. Já ter consulta no dia<br>2. Tentar agendar outra | Bloqueado, exibe aviso |

### 2.3 Lista de Consultas
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| PAC-11 | Filtro por status | 1. Acessar /appointments<br>2. Filtrar por "Confirmadas" | Exibe apenas consultas confirmadas |
| PAC-12 | Cancelamento de consulta | 1. Clicar em consulta pendente<br>2. Clicar "Cancelar"<br>3. Preencher motivo<br>4. Confirmar | Consulta cancelada, status atualizado |
| PAC-13 | Detalhes da consulta | 1. Clicar em uma consulta | Exibe: tipo, médico, data, hora, status, notas |

---

## 3. Testes do Painel Administrativo

### 3.1 Dashboard Admin
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| ADM-01 | Estatísticas corretas | 1. Acessar /admin | Exibe: total pacientes, médicos, pendentes, hoje |
| ADM-02 | Lista de pendentes | 1. Ter consultas pendentes | Exibe lista com ações Aprovar/Rejeitar |
| ADM-03 | Status WhatsApp | 1. WhatsApp conectado | Exibe indicador verde + número |
| ADM-04 | Status WhatsApp desconectado | 1. WhatsApp não conectado | Exibe indicador vermelho |

### 3.2 Calendário
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| ADM-05 | Visualização mensal | 1. Acessar /admin/calendar | Exibe calendário do mês atual |
| ADM-06 | Visualização semanal | 1. Clicar em "Semana" | Exibe visualização semanal |
| ADM-07 | Visualização diária | 1. Clicar em "Dia" | Exibe visualização do dia |
| ADM-08 | Cores por status | 1. Ter consultas com diferentes status | Amarelo=pendente, Azul=confirmada, Verde=concluída, Vermelho=cancelada |
| ADM-09 | Navegação por URL | 1. Acessar /admin/calendar?view=week&date=2026-02-10 | Abre na semana/data especificada |
| ADM-10 | Modal de detalhes | 1. Clicar em um evento | Abre modal com detalhes e ações |
| ADM-11 | Confirmar do calendário | 1. Clicar evento pendente<br>2. Clicar "Confirmar" | Status muda, WhatsApp enviado |
| ADM-12 | Ver ficha do paciente | 1. Clicar evento<br>2. Clicar "Ver Ficha" | Navega para /admin/patients/:id |

### 3.3 Gestão de Consultas (Kanban)
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| ADM-13 | Visualização Kanban | 1. Acessar /admin/appointments | Exibe colunas por status |
| ADM-14 | Navegação lateral | 1. Ter muitas colunas<br>2. Clicar setas | Scroll horizontal funciona |
| ADM-15 | Confirmar consulta | 1. Arrastar card para "Confirmada"<br>ou clicar ação | Status atualizado, WhatsApp enviado |
| ADM-16 | Rejeitar consulta | 1. Clicar "Rejeitar"<br>2. Preencher motivo | Status cancelado, WhatsApp enviado |
| ADM-17 | Filtro por médico | 1. Selecionar médico no filtro | Exibe apenas consultas do médico |
| ADM-18 | Busca por paciente | 1. Digitar nome do paciente | Filtra consultas do paciente |

### 3.4 Gestão de Pacientes
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| ADM-19 | Lista de pacientes | 1. Acessar /admin/patients | Exibe lista paginada |
| ADM-20 | Busca por nome | 1. Digitar nome na busca | Filtra pacientes |
| ADM-21 | Filtro por tipo | 1. Selecionar "VIP" | Exibe apenas VIPs |
| ADM-22 | Ver perfil completo | 1. Clicar em paciente | Abre /admin/patients/:id com ficha completa |
| ADM-23 | Editar paciente | 1. Clicar "Editar"<br>2. Alterar dados<br>3. Salvar | Dados atualizados |
| ADM-24 | Sidebar ativo em sub-página | 1. Estar em /admin/patients/:id | "Pacientes" destacado no sidebar |

### 3.5 Perfil do Paciente
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| ADM-25 | Dados pessoais | 1. Acessar perfil | Exibe: nome, email, telefone, tipo |
| ADM-26 | Informações médicas | 1. Acessar perfil | Exibe: última visita, exames, cadastro |
| ADM-27 | Estatísticas | 1. Acessar perfil | Exibe: total, realizadas, próximas |
| ADM-28 | Histórico de consultas | 1. Acessar perfil | Exibe lista de consultas passadas |
| ADM-29 | Próximas consultas | 1. Ter consultas agendadas | Exibe próximas consultas |
| ADM-30 | Botão Voltar inteligente | 1. Vir de /admin/calendar<br>2. Clicar "Voltar" | Retorna para /admin/calendar |
| ADM-31 | Bordas coloridas | 1. Acessar perfil | Cards têm bordas: marrom, verde, roxo |

### 3.6 Gestão de Médicos
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| ADM-32 | Lista de médicos | 1. Acessar /admin/providers | Exibe lista de médicos |
| ADM-33 | Criar novo médico | 1. Clicar "Novo Médico"<br>2. Preencher dados<br>3. Salvar | Médico criado com senha temporária |
| ADM-34 | Editar médico | 1. Clicar "Editar"<br>2. Alterar dados<br>3. Salvar | Dados atualizados |
| ADM-35 | Desativar médico | 1. Clicar "Desativar"<br>2. Confirmar | is_active = false, não aparece para agendamento |
| ADM-36 | Gerenciar horários | 1. Acessar médico<br>2. Editar horários | Horários salvos em provider_schedules |

### 3.7 Gestão de Admins
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| ADM-37 | Lista de admins | 1. Acessar /admin/admins | Exibe lista de administradores |
| ADM-38 | Criar novo admin | 1. Clicar "Novo Admin"<br>2. Preencher dados<br>3. Salvar | Admin criado |
| ADM-39 | Remover admin | 1. Clicar "Remover"<br>2. Confirmar | Admin removido (role alterada) |

### 3.8 WhatsApp
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| ADM-40 | Lista de instâncias | 1. Acessar /admin/whatsapp | Exibe instâncias com status |
| ADM-41 | Criar instância | 1. Clicar "Nova Instância"<br>2. Definir nome<br>3. Criar | Instância criada |
| ADM-42 | Conectar via QR Code | 1. Clicar "Conectar"<br>2. Escanear QR no celular | Status muda para "conectado" |
| ADM-43 | Desconectar | 1. Clicar "Desconectar" | Status muda para "desconectado" |
| ADM-44 | Excluir instância | 1. Clicar "Excluir"<br>2. Confirmar | Instância removida |
| ADM-45 | Histórico de mensagens | 1. Acessar histórico | Exibe mensagens enviadas com status |

---

## 4. Testes de Integração

### 4.1 Supabase
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| INT-01 | RPC get_available_slots | 1. Chamar RPC com provider, data, tipo | Retorna array de TimeSlot[] |
| INT-02 | RPC check_patient_eligibility | 1. Chamar RPC com patient, tipo | Retorna EligibilityResult |
| INT-03 | RPC create_appointment | 1. Chamar RPC com dados válidos | Cria appointment, retorna ID |
| INT-04 | RLS paciente vê próprios dados | 1. Logado como paciente<br>2. Buscar appointments | Retorna apenas seus appointments |
| INT-05 | RLS admin vê todos dados | 1. Logado como admin<br>2. Buscar appointments | Retorna todos appointments |

### 4.2 Evolution API (WhatsApp)
| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| INT-06 | Verificar conexão | 1. GET /instance/connectionState/:name | Retorna status atual |
| INT-07 | Enviar mensagem | 1. POST /message/sendText | Mensagem enviada, logged |
| INT-08 | Template de confirmação | 1. Confirmar consulta com WhatsApp | Mensagem formatada corretamente |
| INT-09 | Template de cancelamento | 1. Cancelar consulta com WhatsApp | Mensagem formatada corretamente |
| INT-10 | Número inválido | 1. Enviar para número inválido | Erro tratado, log registrado |

---

## 5. Testes de UX/Navegação

| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| UX-01 | Sidebar destaque admin | 1. Navegar para qualquer página admin | Item correto destacado |
| UX-02 | Sidebar destaque sub-página | 1. Acessar /admin/patients/:id | "Pacientes" destacado |
| UX-03 | Sidebar destaque paciente | 1. Acessar /appointments/:id | "Consultas" destacado |
| UX-04 | Botão Voltar inteligente | 1. Navegar Calendar → Perfil<br>2. Clicar Voltar | Retorna para Calendar |
| UX-05 | Confirmação em ações destrutivas | 1. Clicar "Excluir" ou "Remover" | Modal de confirmação aparece |
| UX-06 | Feedback de loading | 1. Executar ação demorada | Spinner/indicador visível |
| UX-07 | Mensagens de erro claras | 1. Provocar erro (ex: sem conexão) | Mensagem amigável exibida |

---

## 6. Testes de Responsividade

| ID | Caso de Teste | Resolução | Resultado Esperado |
|----|---------------|-----------|-------------------|
| RES-01 | Dashboard mobile | 375px | Layout adaptado, cards empilhados |
| RES-02 | Sidebar mobile | 375px | Sidebar oculto, menu hamburger |
| RES-03 | Calendário tablet | 768px | Visualização adaptada |
| RES-04 | Formulários mobile | 375px | Campos full-width, botões acessíveis |
| RES-05 | Kanban mobile | 375px | Scroll horizontal funciona |
| RES-06 | Perfil paciente mobile | 375px | Cards empilhados, legível |

---

## 7. Testes de Internacionalização

| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| I18N-01 | Trocar para Inglês | 1. Clicar seletor idioma<br>2. Selecionar EN | Interface em inglês |
| I18N-02 | Trocar para Espanhol | 1. Clicar seletor idioma<br>2. Selecionar ES | Interface em espanhol |
| I18N-03 | Persistência idioma | 1. Mudar idioma<br>2. Recarregar página | Idioma mantido |
| I18N-04 | Datas localizadas | 1. Trocar idioma<br>2. Ver datas | Formato de data correto |

---

## 8. Testes de Segurança Básicos

| ID | Caso de Teste | Passos | Resultado Esperado |
|----|---------------|--------|-------------------|
| SEC-01 | Acesso não autenticado | 1. Acessar rota protegida sem login | Redireciona para login |
| SEC-02 | Paciente acessando admin | 1. Logar como paciente<br>2. Acessar /admin | Redireciona para /admin/login |
| SEC-03 | SQL Injection básico | 1. Inserir `'; DROP TABLE--` em campo | Entrada sanitizada, sem erro |
| SEC-04 | XSS básico | 1. Inserir `<script>alert(1)</script>` | Script não executado |
| SEC-05 | Dados de outro paciente | 1. Alterar ID na URL para outro paciente | RLS bloqueia, erro ou vazio |

---

## 9. Priorização

### Críticos (Bloqueia uso)
- AUTH-01, AUTH-07, AUTH-11 (Login/Registro)
- PAC-05 (Agendamento)
- ADM-15, ADM-16 (Confirmar/Rejeitar)
- INT-01, INT-02, INT-03 (RPCs)

### Altos (Impacta experiência)
- PAC-06, PAC-07 (Elegibilidade)
- ADM-05 a ADM-12 (Calendário)
- ADM-40 a ADM-44 (WhatsApp)
- UX-01 a UX-07 (Navegação)

### Médios (Funcionalidade secundária)
- PAC-11, PAC-12 (Filtros, Cancelamento)
- ADM-19 a ADM-31 (Gestão Pacientes)
- ADM-32 a ADM-39 (Gestão Médicos/Admins)
- I18N-01 a I18N-04 (Idiomas)

### Baixos (Nice to have)
- RES-01 a RES-06 (Responsividade)
- SEC-03, SEC-04 (Segurança avançada)

---

## 10. Ambiente de Teste

### Requisitos
- Docker rodando (Supabase + Evolution API)
- Frontend em localhost:3000
- Supabase em localhost:8000
- Evolution API em localhost:8082

### Dados de Teste
- **Admin:** valdair3d@gmail.com
- **Médicos:** dr.carlos@teste.com, dr.ana.costa@teste.com
- **Pacientes:** joao.pereira@email.com (senha: demo123456)
- **Tipos de paciente:** new, general, trt, hormone, vip

### Ferramentas
- Browser DevTools (Network, Console)
- Playwright (testes automatizados)
- Supabase Studio (verificar dados)
- Portainer (verificar containers)

---

## 11. Checklist de Execução

```
[ ] 1. Autenticação (AUTH-01 a AUTH-13)
[ ] 2. Portal Paciente (PAC-01 a PAC-13)
[ ] 3. Dashboard Admin (ADM-01 a ADM-04)
[ ] 4. Calendário (ADM-05 a ADM-12)
[ ] 5. Consultas Kanban (ADM-13 a ADM-18)
[ ] 6. Pacientes (ADM-19 a ADM-31)
[ ] 7. Médicos (ADM-32 a ADM-36)
[ ] 8. Admins (ADM-37 a ADM-39)
[ ] 9. WhatsApp (ADM-40 a ADM-45)
[ ] 10. Integrações (INT-01 a INT-10)
[ ] 11. UX/Navegação (UX-01 a UX-07)
[ ] 12. Responsividade (RES-01 a RES-06)
[ ] 13. Internacionalização (I18N-01 a I18N-04)
[ ] 14. Segurança (SEC-01 a SEC-05)
```

---

*Documento gerado em 05/02/2026*
