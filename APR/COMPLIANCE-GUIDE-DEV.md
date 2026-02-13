# Compliance Guide — Essence Medical Clinic Portal
### Guia do Desenvolvedor: Regulamentação, Proteção de Dados e Diretrizes

**Versão:** 1.0
**Data:** 13 de Fevereiro de 2026
**Projeto:** Essence Medical Clinic — Portal Inteligente
**Autor:** Equipe de Desenvolvimento
**Classificação:** Interno — Equipe Dev

---

## 1. Sumário Executivo

### Veredito Legal

A Essence Medical Clinic, com base em análise detalhada do OptiMantra (EHR) e verificação direta dos dados financeiros da clínica, **NÃO é "covered entity" sob a HIPAA**.

**Evidências concretas (verificadas em 13/Fev/2026):**
- Claims Dashboard do OptiMantra: **ZERO claims de seguros** (últimos 90 dias, todos practitioners)
- Coluna "Claims (Claimed/Paid)": **vazia em 100%** das 33 consultas analisadas
- Todos os pagamentos via **Fiserv/CloverConnect** (cartão de crédito direto)
- Superbills com valores redondos ($60–$2,035) = preços cash-pay
- Serviços majoritariamente wellness/estéticos (IV Therapy, Pellets, Morpheus8, Botox)

**Base legal:** 45 CFR §160.103 — "covered entity" requer transmissão eletrônica de "covered transactions" (45 CFR Part 162, Subparts K–S). Todas as transações listadas envolvem interação provider → health plan. A clínica não realiza nenhuma delas.

**E-prescribing NÃO altera esta conclusão.** NCPDP SCRIPT (provider → farmácia) foi adotado sob 42 CFR §423.160 e 45 CFR §170.205(b), NÃO sob HIPAA Administrative Simplification. Confirmado pela Final Rule de E-Prescribing de 2005 (70 FR 67568).

### O que se aplica

| Lei/Regulamento | Aplica-se? | Jurisdição |
|-----------------|-----------|------------|
| HIPAA (45 CFR Parts 160, 164) | **NÃO** | Federal |
| FIPA — Florida Information Protection Act (§501.171 FL) | **SIM** | Florida |
| §456.057 Florida Statutes (confidencialidade médica) | **SIM** | Florida |
| FTC Act §5 (práticas desleais/enganosas) | **SIM** | Federal |
| TCPA — Telephone Consumer Protection Act (47 U.S.C. §227) | **SIM** | Federal |
| Common Law FL (obrigação fiduciária) | **SIM** | Florida |

---

## 2. Regulamentações Detalhadas

### 2.1 FIPA — Florida Information Protection Act (§501.171)

**O que é:** Lei estadual da Flórida que protege informações pessoais. Aplica-se a QUALQUER entidade comercial que coleta dados pessoais na FL, independente de HIPAA.

**Definição de "personal information" protegida (§501.171(1)(g)):**
- Nome + SSN, carteira de motorista, número de passaporte
- Números de contas financeiras + códigos de acesso
- **Informações médicas:** histórico, condição física/mental, tratamento, diagnóstico
- Informações de seguro de saúde

**Requisitos obrigatórios:**

| Requisito | Detalhe | Referência |
|-----------|---------|------------|
| Medidas razoáveis de segurança | Padrão de "razoabilidade" — não prescritivo | §501.171(2) |
| Notificação de breach — indivíduos | **30 dias** (+ 15 dias extensão com justificativa escrita) | §501.171(4)(a) |
| Notificação de breach — FL Dept of Legal Affairs | Se 500+ indivíduos afetados | §501.171(3)(a) |
| Notificação a agências de crédito | Se 1.000+ indivíduos afetados | §501.171(5) |
| Destruição segura de dados | Ao descartar dados pessoais | §501.171(8) |

**Penalidades:** $1.000/dia (primeiros 30 dias), $50.000/período subsequente de 30 dias, máximo $500.000/violação.

**Safe harbor de criptografia:** Dados criptografados são EXCLUÍDOS da definição de "personal information" (§501.171(1)(g)(2)). Se ocorrer breach mas os dados estavam criptografados com AES-256, as obrigações de notificação podem não se aplicar.

**Implicação prática:** Criptografar campos sensíveis com pgcrypto AES-256 cria um safe harbor de facto sob FIPA.

### 2.2 §456.057 Florida Statutes — Confidencialidade Médica

**O que é:** Lei estadual que se aplica a TODOS os profissionais de saúde licenciados pelo FL Dept of Health. Funciona como uma "mini-HIPAA" estadual.

**Requisitos obrigatórios:**

| Requisito | Detalhe | Referência |
|-----------|---------|------------|
| Confidencialidade de informações do paciente | Só pode divulgar a outros providers envolvidos no cuidado, ou com autorização escrita | §456.057(7)(c) |
| Proibição de marketing sem consentimento | Uso de dados para marketing/solicitação proibido sem autorização escrita | §456.057(7)(b) |
| Políticas de segurança escritas | Desenvolver e implementar políticas de confidencialidade | §456.057(10) |
| Treinamento de funcionários | Treinar equipe nas políticas de segurança | §456.057(10) |
| Log de divulgações | Manter registro de todas as divulgações a terceiros | §456.057(11) |
| Retenção de prontuários | **5 anos** após último contato com paciente | §456.057 |

### 2.3 TCPA — Telephone Consumer Protection Act (47 U.S.C. §227)

**O que é:** Lei federal que regula ligações/mensagens automatizadas. CRÍTICO para nosso uso de WhatsApp.

**Ponto importante:** A isenção healthcare do TCPA é para **HIPAA covered entities**. Como a Essence provavelmente NÃO é covered entity, essa isenção pode NÃO se aplicar. Isso significa requisitos de consentimento mais rigorosos.

**Requisitos para mensagens automatizadas (nosso caso):**

| Tipo de mensagem | Consentimento necessário | Exemplo |
|-----------------|-------------------------|---------|
| Informacional (lembretes) | Prior express consent | "Your appointment is tomorrow at 10 AM" |
| Marketing/upsell | Prior express **written** consent | "Try our new IV Therapy package!" |

**Penalidades:** $500–$1.500 **POR MENSAGEM** individual. Uma campanha de 100 mensagens sem consentimento = até $150.000.

**Requisitos obrigatórios para nosso sistema:**
1. **Consent form escrito** antes de qualquer mensagem automatizada
2. **Opt-out ("STOP")** em TODA mensagem
3. **Respeitar STOP imediatamente** — gravar no DB, nunca mais enviar
4. **Identificação do remetente** em cada mensagem
5. **Horário comercial** — não enviar entre 9pm–8am (boas práticas)
6. **Nunca mencionar tipo de tratamento** — usar apenas data/hora/local/provider

### 2.4 FTC Act §5 (15 U.S.C. §45)

**O que é:** Proíbe práticas desleais ou enganosas no comércio. Aplica-se a TODAS as entidades comerciais.

**Riscos concretos:**
- Se o portal diz "seus dados são protegidos" mas não usa criptografia = prática enganosa
- Se compartilha dados com terceiros sem disclosure = prática desleal
- **FTC Health Breach Notification Rule** (16 CFR Part 318) pode se aplicar a entidades não-HIPAA

**Penalidade:** Até $53.088 por violação.

**Implicação:** Não fazer claims de segurança/privacidade que não sejam verdadeiros. Se dissermos "criptografado", tem que estar criptografado.

---

## 3. Diretrizes de Desenvolvimento

### 3.1 Dados do Paciente no Supabase

**Regra geral:** Podemos manter dados operacionais dos pacientes no Supabase. A obrigação é protegê-los com "medidas razoáveis" (FIPA).

**Campos que DEVEM ser criptografados (pgcrypto AES-256):**

| Campo | Tabela | Motivo |
|-------|--------|--------|
| SSN / Tax ID | profiles | Identificador crítico — FIPA "personal information" |
| Insurance policy number | profiles | Dados financeiros/seguro |
| Insurance group number | profiles | Dados financeiros/seguro |
| Insurance member ID | profiles | Dados financeiros/seguro |
| Date of birth | profiles | Identificador pessoal |
| Phone number | profiles | Identificador pessoal + TCPA |
| Emergency contact phone | profiles | Identificador pessoal |
| Medical notes (se houver) | appointments/documents | Informação médica — §456.057 |
| Prescription data (se armazenada) | patient_documents | Informação médica — §456.057 |

**Campos que NÃO precisam de criptografia (mas precisam de RLS):**
- first_name, last_name — necessários para operação (já protegidos por RLS)
- email — necessário para auth (já protegido por RLS)
- appointment dates/times — operacional
- patient_type — operacional (não é diagnóstico médico)

**RLS (Row Level Security):** Já implementado em 100% das tabelas — manter.

### 3.2 Prescrições e Documentos Clínicos

**Se for implementar armazenamento de prescrições:**
1. Criptografar o conteúdo inteiro com pgcrypto AES-256
2. Nunca armazenar substâncias controladas em texto claro
3. Implementar audit log de acessos (quem viu, quando)
4. Retenção máxima de 5 anos (§456.057)
5. Capacidade de deletar/destruir dados de forma segura

**Alternativa mais segura (passthrough):**
- Buscar prescrição do OptiMantra via automação
- Exibir ao paciente no browser (dados em memória)
- Nunca persistir no Supabase
- Menor responsabilidade legal

### 3.3 WhatsApp (Evolution API) — Regras Obrigatórias

**Template de TODA mensagem automatizada:**
```
[Conteúdo da mensagem — SEM tipo de tratamento]

Reply STOP to unsubscribe | Essence Medical Clinic
```

**Regras de conteúdo:**
- OK: "Your appointment is tomorrow at 10:00 AM with Dr. Rosane Nunes"
- OK: "Reminder: you have an appointment on Feb 15 at 2:30 PM"
- PROIBIDO: "Your testosterone injection is scheduled for..."
- PROIBIDO: "Time for your Morpheus8 follow-up!"
- PROIBIDO: "Your lab results are ready" (implica condição médica)

**Implementação obrigatória no webhook:**
1. Verificar `whatsapp_consent = true` antes de enviar qualquer mensagem
2. Campo `whatsapp_consent_at` (timestamp) no profiles
3. Campo `whatsapp_opted_out` (boolean) no profiles
4. Se paciente responder "STOP" → setar `whatsapp_opted_out = true`, NUNCA mais enviar
5. Log de todas as mensagens enviadas (já temos em `message_logs`)
6. Não enviar entre 9pm–8am EST

**Consent form (texto para o portal):**
> "I consent to receive automated appointment reminders, confirmations, and clinic communications via WhatsApp/SMS from Essence Medical Clinic at the phone number provided. Message frequency varies. Reply STOP to opt out at any time. Standard messaging rates may apply. This consent is not a condition of receiving services."

### 3.4 Breach Response Plan

**Se ocorrer um breach (vazamento de dados):**

| Prazo | Ação | Responsável |
|-------|------|-------------|
| Imediato | Conter o breach, preservar evidências | Dev team |
| 24h | Avaliar escopo e dados afetados | Dev team + Cliente |
| 72h | Notificar cliente (Essence/Mateus) | Dev team |
| 30 dias | Notificar indivíduos afetados | Cliente |
| 30 dias | Notificar FL Dept of Legal Affairs (se 500+) | Cliente |
| 30 dias | Notificar agências de crédito (se 1.000+) | Cliente |

**Safe harbor:** Se dados estavam criptografados (AES-256) e chaves não foram comprometidas → notificação pode NÃO ser necessária (§501.171(1)(g)(2)).

---

## 4. Checklist de Implementação

### 4.1 Ações Obrigatórias (FIPA + §456.057 + TCPA)

- [ ] Implementar criptografia pgcrypto AES-256 para campos sensíveis (SSN, insurance, DOB, phone)
- [ ] Adicionar campo `whatsapp_consent` e `whatsapp_consent_at` na tabela profiles
- [ ] Adicionar campo `whatsapp_opted_out` na tabela profiles
- [ ] Implementar handler de "STOP" no webhook — setar opted_out = true
- [ ] Adicionar "Reply STOP to unsubscribe" em TODA mensagem automática
- [ ] Remover qualquer menção a tipo de tratamento nas mensagens WhatsApp
- [ ] Verificar que NENHUMA mensagem é enviada sem consent = true
- [ ] Implementar audit log de acesso a dados sensíveis
- [ ] Adicionar consent form/checkbox no registro do paciente no portal
- [ ] Não enviar mensagens entre 9pm–8am EST

### 4.2 Ações Recomendadas (boas práticas)

- [ ] Criptografar disco da VPS com LUKS (full-disk encryption)
- [ ] Implementar retenção de dados com prazo (5 anos após último contato)
- [ ] Criar Privacy Policy para o portal (exibir no registro)
- [ ] Implementar "delete my data" para pacientes (right to deletion)
- [ ] Backup criptografado dos dados (já implementado parcialmente)
- [ ] Monitoramento de acesso anômalo
- [ ] Revisar e documentar todos os terceiros que acessam dados

### 4.3 NÃO é necessário (sem HIPAA)

- ~~BAA (Business Associate Agreement) formal~~
- ~~Hosting HIPAA-compliant (AWS BAA, Vultr)~~
- ~~Audit trail de 6 anos~~
- ~~Privacy Officer designado~~
- ~~Security Officer designado~~
- ~~Notice of Privacy Practices (NPP)~~
- ~~HIPAA Security Risk Analysis~~
- ~~Treinamento HIPAA para equipe~~

---

## 5. Ponto de Atenção: SureScripts Eligibility

**RISCO RESIDUAL:** Se qualquer pessoa na clínica usar o SureScripts (via OptiMantra) para verificar elegibilidade de seguro de um paciente — mesmo UMA vez — a clínica pode se tornar covered entity.

**Ação:** Confirmar com o cliente (Mateus/Dra. Rosane) que:
1. A clínica NÃO usa eligibility check via SureScripts
2. A clínica NÃO usa formulary lookup
3. A clínica NÃO usa electronic prior authorization
4. A clínica usa APENAS e-prescribing básico (enviar receita para farmácia)

**Se a resposta for "não usamos nenhuma dessas"** → posição legal é sólida.
**Se a resposta for "usamos eligibility check"** → reclassificar como covered entity e implementar HIPAA compliance.

---

## 6. Data Protection Agreement (DPA) — Rascunho

Em vez de BAA (que não é obrigatório), usar um DPA mais simples:

### Termos essenciais do DPA:

1. **Escopo:** Desenvolvedor tem acesso a dados pessoais de pacientes para fins de desenvolvimento e manutenção do portal
2. **Confidencialidade:** Desenvolvedor não divulgará dados pessoais a terceiros sem autorização
3. **Segurança:** Desenvolvedor implementará medidas razoáveis de proteção (criptografia, RLS, backup)
4. **Notificação de breach:** Desenvolvedor notificará o cliente em até 72 horas de qualquer breach suspeito
5. **Retenção:** Dados de desenvolvimento/teste usarão APENAS dados fictícios (padrão +1555000XXXX e @example.com)
6. **Devolução/destruição:** Ao término do contrato, desenvolvedor retornará ou destruirá todos os dados
7. **Conformidade:** Desenvolvedor seguirá FIPA (§501.171) e §456.057 no tratamento dos dados
8. **Subcontratados:** Qualquer subcontratado com acesso a dados deve concordar com termos equivalentes
9. **Auditoria:** Cliente pode solicitar evidências de conformidade a qualquer momento

---

## 7. Fontes Legais

| Referência | Descrição | URL |
|------------|-----------|-----|
| 45 CFR §160.103 | Definição de "covered entity" | ecfr.gov/current/title-45/part-160/section-160.103 |
| 45 CFR Part 162, Subparts K–S | Lista de "covered transactions" | ecfr.gov/current/title-45/part-162 |
| 70 FR 67568 (Nov 2005) | Final Rule de E-Prescribing | federalregister.gov/d/05-21765 |
| §501.171 Florida Statutes | FIPA — Florida Information Protection Act | leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.171.html |
| §456.057 Florida Statutes | Confidencialidade de prontuários médicos FL | leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0400-0499/0456/Sections/0456.057.html |
| 47 U.S.C. §227 | TCPA — Telephone Consumer Protection Act | law.cornell.edu/uscode/text/47/227 |
| 15 U.S.C. §45 | FTC Act §5 — Práticas desleais/enganosas | law.cornell.edu/uscode/text/15/45 |
| 16 CFR Part 318 | FTC Health Breach Notification Rule | ecfr.gov/current/title-16/part-318 |
| HHS Covered Entities Guidance | "Are You a Covered Entity?" | hhs.gov/hipaa/for-professionals/covered-entities |
| 42 CFR §423.160 | E-prescribing standards (Medicare Part D) | ecfr.gov/current/title-42/part-423/section-423.160 |

---

## 8. Glossário

| Termo | Significado |
|-------|-------------|
| **Covered Entity** | Entidade sujeita à HIPAA (health plan, clearinghouse, ou provider que transmite covered transactions) |
| **Covered Transaction** | Transação eletrônica provider → health plan listada em 45 CFR Part 162 |
| **PHI** | Protected Health Information — informação de saúde + identificador pessoal |
| **BAA** | Business Associate Agreement — contrato HIPAA entre covered entity e business associate |
| **DPA** | Data Protection Agreement — contrato de proteção de dados (alternativa ao BAA quando HIPAA não aplica) |
| **FIPA** | Florida Information Protection Act — lei estadual de proteção de dados |
| **TCPA** | Telephone Consumer Protection Act — lei federal de proteção ao consumidor (ligações/mensagens) |
| **pgcrypto** | Extensão PostgreSQL para criptografia field-level (AES-256) |
| **RLS** | Row Level Security — controle de acesso por linha no PostgreSQL |
| **LUKS** | Linux Unified Key Setup — criptografia full-disk |
| **Safe Harbor** | Proteção legal que isenta de obrigações (ex: dados criptografados sob FIPA) |
| **OCR** | Office for Civil Rights do HHS — órgão que fiscaliza HIPAA |
| **SureScripts** | Rede de e-prescribing nos EUA |
| **NCPDP SCRIPT** | Padrão para prescrição eletrônica (provider → farmácia) |
| **Superbill** | Recibo/fatura detalhada que o paciente pode usar para reembolso de seguro |

---

*Documento criado em: 13 de Fevereiro de 2026*
*Próxima revisão: Quando cliente confirmar status do SureScripts eligibility check*
*Versão: 1.0*
