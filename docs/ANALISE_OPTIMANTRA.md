# Analise OptiMantra vs Portal Essence - Gap Analysis

> Analise realizada em 09/02/2026 a partir do painel OptiMantra logado da clinica.

---

## Dados da Clinica no OptiMantra

| Campo | Valor |
|-------|-------|
| **Nome** | Essence Medical Clinic |
| **Endereco** | 2000 NE 44TH ST SUITE 101B, Lighthouse Point, FL 33064 |
| **Telefone** | 954-756-2565 |
| **NPI** | 1295179323 |
| **Practitioners** | Rosane Nunes, MD + Registered Nurse |
| **Total Pacientes** | 1.138 |
| **Horario** | 8am-6pm (slots de 15min) |
| **Email** | shapeuphealthsolutions@gmail.com |

---

## O Que o OptiMantra Tem (Mapa Completo)

### 1. Scheduling (Calendario)
- Visualizacoes: Day, Week, Month
- Sub-visualizacoes: Practitioner, Rooms, List, Pract-Rooms, Staff/Week
- **Waitlist** por dia (0-N pacientes em espera)
- **Blocos** de agenda ("Block - no nurse", "BLOCK")
- Filtro por practitioner
- Slots de **15 minutos**
- Consultas In-Office e **Telehealth**

### 2. Patients (1.138 pacientes)
**Abas do perfil:**
- **Demographic**: Nome completo (First/Middle/Last), Preferred Name, Email, Contact Method, Personal ID, DOB, Sex at Birth, Race, Ethnicity, Gender Identity, Pronoun, Preferred Language (EN/ES/Other), Age Group, Phones (Preferred/Alternative/Text), Endereco completo, Primary Practitioner, Primary Care Physician, Guardian, Emergency Contact, Marital Status, Occupation, Referred By, Timezone, Patient Notes, Tags, Access Patient Portal, Inactive flag
- **Next of Kin**: Contato de emergencia detalhado
- **Insurance**: Plano (ex: OSCAR SILVER SIMPLE), ID, Group, Copay ($0-N), Co-Insurance %, Deductible, Payer info, Referring Provider NPI
- **Sec Insurance**: Seguro secundario
- **Payment**: Cartao de credito no arquivo (Cardholder, Number, CVV, Exp, Billing Address)
- **Eligibility Check**: Verificacao de cobertura
- **Pre Auth**: Pre-autorizacao

**Acoes por paciente:**
- Admin: Profile, Email, Text, Tasks, Documents, Phone, Vitals, Intake, Consent, Messages
- Clinical: Initial Consult, Follow Up, Basic Note, Charting History, Questionnaire, Dashboard, eRx, Lab/Diagnostics, Custom Formulations, Submitted Intakes, Send Records
- Point of Sale: Superbill, Take Card Payment, Form1500, Fullscript, Wholescripts, Recommendations, Check Balance, Appointments, Video Chat

### 3. Checkout (Faturamento)
- Filtro por Practitioner e periodo
- Colunas: Date, Patient, Appointments, Charting, Superbills (Total/Paid), Claims (Claimed/Paid)
- Export Excel/CSV
- **103 entries** (periodo atual)
- Botoes: +Superbill, +Claim

### 4. Inventory (Estoque)
- **73 itens** (suplementos, medicamentos)
- **56 itens com estoque baixo** (alerta)
- Colunas: Vendor, Type (Inventory/Non-inventory), Location, Name, MPN, Price, Cost, Exp Date, Lot, On-Hand, On-Order
- Produtos exemplo: Adrenal Caps, Hair Formula, Metabolic Xtra, Progesterone, DHEA, DIM+I3C
- Export Excel/CSV

### 5. Analytics (Relatorios)
- Daily Deposit by Date of Payment
- Colunas: Practitioner, Date, Payment Method, Payment Desc, Super Bill, Patient, State, Zip, Charge Desc
- Pagamento por CARD (processador configurado)
- **$1,807.56 processado em 09/02/2026** (dia normal)
- Grid, Graph, Export PDF/Excel
- Relatorios altamente configuraveis

### 6. Services (Fee Schedule) - 65 servicos

#### OFFICE_VISIT (Consultas)
| Servico | Duracao | Preco |
|---------|---------|-------|
| Functional Medicine Consultation - In Office | 90min | $300 |
| Functional Medicine Consultation - Telehealth | 90min | $300 |
| Initial Consultation Deposit | 60min | $100 |
| Mid-Level Consultation | 45min | $200 |
| Morpheous8 Evaluation - In Office | 30min | $0 |
| Morpheous8 Evaluation - Telehealth | 30min | $0 |
| Nutritionist Consult | 60min | $120 |
| Office Visit - In Office | 45min | $125 |
| Office Visit - Telehealth | 45min | $125 |
| Inbody | 10min | $50 |

#### PROCEDURE (Procedimentos)
| Servico | Duracao | Preco | Custo |
|---------|---------|-------|-------|
| Botox | 30min | $600 | $100 |
| Calorimetry | 15min | $70 | $20 |
| Female Pellet | 30min | $450 | $75 |
| Fillers | 60min | variavel | - |
| High Dose Vitamin C | 45min | $220 | - |
| Homocysteine Management IV | 60min | $220 | $50 |
| Inflammation IV | 60min | $220 | $50 |
| Insulin Resistance IV Therapy | 60min | $220 | $100 |
| Iron Infusion | 60min | $180 | - |
| IV Therapy (Package) | 45min | $180 | - |
| IV Therapy | 60min | $250 | - |
| Male Pellet | 30min | $850 | $150 |
| Metabolic IV | 60min | $220 | $50 |
| Morpheous8 Session | 120min | $1,000 | $145 |
| Nandrolone Injection | 10min | $30 | - |
| Testosterone Injection | 10min | $25 | - |
| Tirzepatide 2.5mg (1 month) | 5min | $300 | $50 |
| Tirzepatide 5mg (1 month) | 5min | $350 | $100 |
| Tirzepatide 7.5mg (1 month) | 5min | $375 | $130 |
| Vitamin Shot | 10min | $30 | $5 |
| Weight Loss Injection | 10min | $75 | - |

#### LAB (Exames - via Labcorp)
| Servico | Preco | Custo |
|---------|-------|-------|
| Bloodwork (geral) | $250 | $123 |
| CBC | $6 | $2.60 |
| C-Reactive Protein HS | $14 | $7.20 |
| Complete Hormone Exam Female | $150 | $75 |
| Complete Hormone Exam Male | $150 | $75 |
| Comprehensive Metabolic Panel | $10 | $3.25 |
| DHEA-S | $14 | $7.50 |
| Estradiol | $14 | $7.10 |
| Ferritin | $10 | $5.40 |
| Free T4 | $10 | $5.50 |
| FSH & LH | $18 | $8.40 |
| Hemoglobin A1C | $10 | $4.50 |
| Homocysteine | $65 | $35 |
| Insulin | $16 | $6.50 |
| Iron & TIBC | $10 | $4.80 |
| Lipid Panel | $10 | $3.50 |
| Lipoprotein(a) | $60 | $31 |
| Progesterone | $20 | $7.25 |
| Sed Rate | $6 | $3 |
| SHBG | $40 | $20 |
| T3 Free | $12 | $6 |
| Testosterone Free & Total | $40 | $18 |
| Thyroglobulin AB | $50 | $26 |
| TPO AB | $60 | $31 |
| TruAge Exam | $499 | - |
| TruHealth Exam | $499 | - |
| TSH | $10 | $3 |
| Uric Acid | $7 | $2.60 |
| Vitamin B12 | $20 | $9.60 |
| Vitamin D | $38 | $18 |

#### OTHER (Diversos)
| Servico | Preco | Custo |
|---------|-------|-------|
| Estradiol Cream 90 days | $75 | $30 |
| Testosterone Cream 90 days | $75 | $30 |
| Phlebotomy Fee | $20 | - |
| Shipping | $15 | - |

### 7. Settings (Configuracoes)

| Secao | Sub-itens |
|-------|-----------|
| **Business** | Location(s), User Management, Resources, Individual User Preferences, Provider Settings, OptiMantra Subscription, Contact List |
| **Services** | Services (Fee Schedule), Service Packages, Service Group/Templates, Classes, Service & Product Categorization |
| **Scheduling** | Org Settings, Provider Calendar, Online Booking, Prospect Registration |
| **Forms** | (formularios customizados) |
| **Communications** | Patient Portal and Kiosk, Reminder Email, Reminder Text, Email Templates, Text (SMS) Templates, Cancellation Templates, Birthday Reminders, 2-Way Texting & Reviews, Patient Tags |
| **Clinical Templates** | (templates SOAP, charting) |
| **Clinical Integrations** | (Labcorp, etc.) |
| **Payments** | Processors (Fiserv/Stripe Express/Stripe Standard/Authorize.Net), Customize Superbill, Coupons (Discounts), Patient Invoicing, Gift Card Config, Good Faith Estimate Templates |
| **Insurance** | (configuracao de seguros) |
| **Marketing** | (newsletters, campanhas) |
| **Integrations** | Caretaker, Inbody, Spakinect |

### 8. Barra Superior (Comunicacao)
- **Tasks**: 6 tarefas pendentes
- **Notifications**: 99+ (alertas do sistema)
- **Messages**: mensagens internas do portal
- **Texts**: 99+ SMS (2-way texting)
- **Faxes**: e-faxing
- **Office Chat**: chat interno da equipe

---

## Gap Analysis: Portal Essence vs OptiMantra

### JA TEMOS (funcional)

| Funcionalidade | Portal Essence | Status |
|----------------|---------------|--------|
| Calendario (Day/Week/Month) | CalendarPage | OK |
| Lista de pacientes com busca | PatientsPage | OK |
| Perfil basico do paciente | PatientProfilePage | Parcial |
| Tipos de consulta (18 ativos) | treatments.ts + treatment_types | OK |
| Criacao de agendamento | NewAppointmentPage | OK |
| Fluxo de status (pending->completed) | AdminDashboard + AdminAppointmentsPage | OK |
| Blocos de agenda | CalendarPage + provider_blocks | OK |
| Gestao de providers | ProvidersPage | OK |
| Gestao de admins | AdminsPage | OK |
| WhatsApp notifications | Evolution API + webhook | OK |
| Lembretes automaticos | reminderScheduler (cron 5min) | OK |
| No-show tracking | no_show_count + auto-detect | OK |
| Confirmacao por WhatsApp | patientHandler | OK |
| Retry mensagens falhas | retrySender + FailedMessagesPage | OK |
| Elegibilidade | check_patient_eligibility | OK |
| Patient Portal (basico) | Login, Dashboard, Appointments | OK |
| i18n (PT/EN/ES) | react-i18next | OK |

### GAPS - Prioridade ALTA (essencial para a clinica operar)

| # | Funcionalidade | Impacto | Complexidade |
|---|---------------|---------|-------------|
| 1 | **Precos nos servicos** | A clinica precisa saber quanto cobrar. Nosso treatment_types nao tem preco | Media |
| 2 | **Pagamento com cartao (POS)** | Processam ~$1,800/dia por cartao. Stripe seria o mais simples | Alta |
| 3 | **Perfil completo do paciente** | Faltam: endereco completo, emergency contact, preferred name, sex at birth, race, ethnicity, marital status, occupation, referred by, patient notes | Media |
| 4 | **Insurance (seguro saude)** | Muitos pacientes tem seguro (ex: OSCAR). Precisamos armazenar plano, ID, copay | Media |
| 5 | **Superbill / Faturamento** | Geram superbills para cada consulta com servicos, precos, codigos CPT | Alta |
| 6 | **Telehealth** | Marcam consultas In-Office e Telehealth. Precisamos de flag + link video | Media |

### GAPS - Prioridade MEDIA (importante para crescimento)

| # | Funcionalidade | Impacto | Complexidade |
|---|---------------|---------|-------------|
| 7 | **Servicos que faltam no nosso sistema** | Weight Loss Injection, Male/Female Pellet, Testosterone/Nandrolone Injection, Tirzepatide, Inbody, Calorimetry, Nutritionist Consult, etc. | Baixa |
| 8 | **Inventario/Estoque** | 73 produtos (suplementos, meds), controle de quantidade, custos, validade | Alta |
| 9 | **Labs/Exames** | 30+ exames Labcorp com precos. Precisamos de modulo de exames | Alta |
| 10 | **SMS/Text 2-Way** | 99+ SMS. WhatsApp cobre parte, mas SMS e padrao nos EUA | Media |
| 11 | **Email (reminder + templates)** | Reminder por email alem do WhatsApp | Media |
| 12 | **Documentos do paciente** | Upload/download de docs, exames, consent forms | Media |
| 13 | **Intake/Consent forms** | Formularios digitais pre-consulta | Media |
| 14 | **Waitlist** | Fila de espera por dia | Baixa |
| 15 | **Analytics/Reports** | Relatorios financeiros, de pacientes, tendencias | Alta |

### GAPS - Prioridade BAIXA (nice-to-have)

| # | Funcionalidade | Impacto | Complexidade |
|---|---------------|---------|-------------|
| 16 | Charting/EMR (SOAP notes) | Prontuario eletronico completo | Muito Alta |
| 17 | eRx (e-prescriptions) | Prescricao eletronica (precisa DEA) | Muito Alta |
| 18 | Gift Cards / Coupons | Descontos e gift cards | Media |
| 19 | Marketing (newsletters, birthday) | CRM marketing | Media |
| 20 | Fax | E-faxing | Alta |
| 21 | Office Chat | Chat interno equipe | Media |
| 22 | Claims / Form1500 / Insurance Billing | Faturamento de seguros | Muito Alta |
| 23 | Custom Formulations | Farmacia de manipulacao | Alta |
| 24 | Patient Tags | Categorizacao livre (temos patient_type) | Baixa |
| 25 | Rooms management | Salas da clinica | Baixa |

---

## Servicos Que Faltam no Nosso Sistema

Comparando os 65 servicos do OptiMantra com nossos 18 tipos ativos:

### Servicos que precisamos ADICIONAR:
1. **Weight Loss Injection** - 10min, $75
2. **Male Pellet** - 30min, $850
3. **Female Pellet** - 30min, $450
4. **Testosterone Injection** - 10min, $25
5. **Nandrolone Injection** - 10min, $30
6. **Tirzepatide** (3 dosagens) - 5min, $300-375
7. **Inbody** (body composition) - 10min, $50
8. **Calorimetry** - 15min, $70
9. **Nutritionist Consult** - 60min, $120
10. **Mid-Level Consultation** - 45min, $200
11. **Office Visit** (follow-up generico) - 45min, $125
12. **High Dose Vitamin C** - 45min, $220
13. **Inflammation IV** - 60min, $220
14. **Metabolic IV** - 60min, $220
15. **Homocysteine Management IV** - 60min, $220
16. **Insulin Resistance IV** - 60min, $220
17. **Iron Infusion** - 60min, $180
18. **Morpheous8 Evaluation** - 30min, $0
19. **Morpheous8 Session** - 120min, $1,000

### Servicos que ja temos (match):
- Initial Consultation = Initial Consultation Deposit
- Follow Up = Office Visit (parcial)
- Functional Medicine = Functional Medicine Consultation
- BHRT = (parcial - eles tem Pellet separado)
- Morpheus8 = Morpheous8 (avaliacao + sessao)
- Botulinum Toxin = Botox
- Fillers = Fillers
- IV Protocols / Customized IV = IV Therapy
- NAD Therapy = (nao encontrado no fee schedule - pode ser custom)
- Vitamin Injections = Vitamin Shot
- Nutrient Testing = Bloodwork (parcial)

---

## Recomendacao de Proximos Passos

### Fase 1 - Essencial (proximo sprint)
1. **Expandir perfil do paciente** - Adicionar campos: endereco, emergency contact, sex at birth, etc.
2. **Adicionar precos nos servicos** - Campo `price` e `cost` na tabela `treatment_types`
3. **Novos tipos de servico** - Adicionar os 19 que faltam
4. **Flag Telehealth** - Diferenciar In-Office vs Telehealth nos appointments

### Fase 2 - Financeiro (essencial para operar)
5. **Stripe integration** - Pagamento com cartao
6. **Superbill basico** - Gerar recibo/fatura por consulta
7. **Modulo de seguro** - Tabela de insurance no perfil do paciente

### Fase 3 - Clinico
8. **Modulo de exames** - Acompanhar resultados de lab
9. **Documentos** - Upload de docs, consent forms
10. **Intake forms** - Formularios digitais pre-consulta

### Fase 4 - Avancado
11. **Inventario** - Controle de estoque de suplementos/meds
12. **Analytics** - Dashboard financeiro e relatorioss
13. **Email notifications** - Alem do WhatsApp

---

## Observacoes Importantes

1. **A clinica processa ~$1,800/dia em cartao** - gateway de pagamento e CRITICO
2. **Stripe Express nao esta configurado no OptiMantra** - estao usando outro processador (provavelmente Fiserv)
3. **1.138 pacientes reais** - migrar dados seria um projeto grande
4. **2 practitioners**: Dra. Rosane (MD) + Registered Nurse - nosso sistema ja suporta
5. **Labs sao via Labcorp** - integracao direta pode nao ser necessaria inicialmente (podem continuar usando Labcorp separado)
6. **Muitos IVs especificos** (Inflammation, Metabolic, Homocysteine, Insulin Resistance) - nosso `iv_protocols` e generico demais
7. **Weight Loss (Tirzepatide/Ozempic)** - servico em alta demanda, precisa estar no sistema
8. **Telehealth** e usado ativamente - precisamos suportar
