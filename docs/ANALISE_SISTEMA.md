# Análise do Sistema - Essence Medical Clinic

Análise completa baseada no site da clínica, OptiMantra EMR e requisitos do cliente.

*Criado: 07/02/2026*

---

## 1. Dados da Clínica (Site Oficial)

### Informações Atualizadas
| Campo | Valor |
|-------|-------|
| **Nome** | Essence Medical Clinic |
| **Endereço** | 2000 NE 44th ST, Suite 101B, Fort Lauderdale, FL 33308 |
| **Telefone** | +1 (954) 756-2565 |
| **Email** | team@essencemedicalclinic.com |
| **Horário** | Mon-Fri 10am-6pm |
| **Sábado** | 11am-3pm (2x por mês) |
| **Site** | https://essencemedicalclinic.com |
| **Lead Provider** | Dr. Rosane Nunes |

### Tratamentos Oferecidos (Site)

**Já implementados no sistema (18 tipos):**
- Initial Consultation, Follow-up
- Functional Medicine, BHRT, Male/Female Hypertrophy
- Insulin Resistance, Chronic Inflammation, Thyroid Support
- Morpheus8, Botulinum Toxin, Fillers, Skin Boosters
- IV Protocols, Customized IV Nutrition, Nutrient Testing, NAD+ Therapy, Vitamin Injections

**Não implementados ainda (encontrados no site):**
| Tratamento | Categoria | Duração estimada |
|------------|-----------|-----------------|
| High Cortisol Management | Personalized | 45 min |
| Iron Infusions | IV Therapy | 60 min |
| Chelation Therapy | IV Therapy | 90 min |
| **Peptide Therapy** (categoria inteira) | Nova categoria | Variável |

**Peptide Therapy — 8 peptídeos listados no site:**
1. BPC-157 (recuperação, gut healing)
2. Thymosin Alpha-1 (imunidade)
3. CJC-1295/Ipamorelin (GH, anti-aging)
4. PT-141 (sexual wellness)
5. Selank (ansiedade, cognição)
6. KPV (anti-inflamatório)
7. Dihexa (neuroproteção)
8. MOTS-c (metabolismo, exercício)

---

## 2. OptiMantra (EMR Atual)

### O que é
OptiMantra é um EMR cloud para medicina integrativa/funcional. É o sistema que a clínica usa hoje para prontuários.

### Funcionalidades do OptiMantra
| Módulo | Descrição |
|--------|-----------|
| **Prontuários (SOAP)** | Notas médicas estruturadas |
| **Intake Forms** | Formulários de admissão digital |
| **Consent Forms** | Consentimentos assinados digitalmente |
| **Lab Orders/Results** | Pedidos e resultados de exames (LabCorp, Quest) |
| **Prescrições** | e-Prescriptions via SureScripts |
| **Faturamento** | Superbills, insurance claims, invoices |
| **Portal do Paciente** | Self-scheduling, formulários, mensagens, pagamentos |
| **Inventário** | Controle de suplementos e produtos |
| **Templates** | Templates de consulta customizáveis |

### Limitação Crítica: Integração
- **NÃO tem API REST pública** para receber dados
- **Só tem webhooks de saída** (outbound) — pode notificar eventos, mas não aceita dados de volta
- **Integrações nativas:** LabCorp, Quest, Stripe, SureScripts, Zoom Telehealth, Fullscript
- **Conclusão:** Integração bidirecional programática não é possível. A abordagem será via automação de browser (Playwright MCP) com o usuário logado no OptiMantra

### Implicações para o Projeto
1. **Documentos/exames**: Nosso sistema gerenciará uploads independentes do OptiMantra
2. **Prontuários**: AI Scribe (Plaud) gera notas → precisamos de automação para inserir no OptiMantra
3. **Agendamento**: Nosso sistema é o principal; sync com OptiMantra via automação
4. **Faturamento**: OptiMantra continua como sistema principal de billing
5. **Labs**: Resultados podem vir do OptiMantra (outbound webhook) para nosso sistema

---

## 3. Mapeamento: 6 Pilares do Cliente vs Sistema

### Pilar 1: Comunicação Automatizada com Pacientes

| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Follow-ups automáticos | ✅ | Lembretes WhatsApp (24h, 1h) via cron |
| Confirmações de consulta | ✅ | WhatsApp auto + resposta "OK/sim" |
| Cancelamento inteligente | ✅ | Aviso <24h, motivo, link reagendamento |
| No-show detection | ✅ | 30min após fim → marca no_show + notifica |
| Retry de mensagens falhas | ✅ | Até 3 tentativas + página de monitoramento |
| Fluxos por tipo de paciente | ✅ | 5 tipos ativos com regras de elegibilidade |
| SMS/Email além do WhatsApp | ❌ | Twilio (SMS) e Resend (Email) planejados, não implementados |
| Nurturing sequences | ❌ | Mensagens programadas pós-consulta (follow-up em 7/30/90 dias) |

### Pilar 2: Agendamento Inteligente com Depósitos

| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Portal de agendamento | ✅ | Multi-step: tipo → elegibilidade → médico → data/hora |
| Regras de elegibilidade | ✅ | BHRT/hormonal requer labs 6 meses + visita |
| Calendário admin | ✅ | react-big-calendar (mês/semana/dia/agenda) |
| Múltiplos turnos/dia | ✅ | Manhã + tarde com pausa almoço |
| Bloqueios de agenda | ✅ | Férias, reuniões, horários personalizados |
| Depósitos/pagamentos | ❌ | Precisa Stripe/Square |
| Waitlist (lista de espera) | ❌ | Não implementado |
| Self-scheduling via OptiMantra | ❌ | Sync de agenda com OptiMantra via automação |

### Pilar 3: Portal do Paciente com Compras e Critérios Clínicos

| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Login/Cadastro | ✅ | Email/senha + Google OAuth |
| Dashboard com próximas consultas | ✅ | Cards + CTA de agendamento |
| Histórico de consultas | ✅ | Lista completa com detalhes |
| Perfil + preferências | ✅ | Dados pessoais + idioma |
| Upload/visualização de documentos | 🔄 | Em desenvolvimento (DocumentViewerModal) |
| Recomendações personalizadas | ❌ | Plano de tratamento pós-consulta |
| Compra de produtos/suplementos | ❌ | E-commerce (Stripe + inventário) |
| Prescrições visíveis | ❌ | Integração com OptiMantra/SureScripts |
| Mensagens com a clínica | ❌ | Chat interno (não WhatsApp) |
| Pagamentos online | ❌ | Stripe integration |

### Pilar 4: Motor de Vendas e Upsells

| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Serviços add-on relevantes | ❌ | Baseado no tipo/histórico do paciente |
| Programas de follow-up | ❌ | Pacotes de consultas (ex: 6 sessões Morpheus8) |
| Memberships/assinaturas | ❌ | Planos mensais com benefícios |
| Timing na jornada do paciente | ❌ | Triggers automáticos (30/60/90 dias pós-consulta) |
| Sem intervenção manual | ❌ | Recomendações automáticas por perfil |

### Pilar 5: Documentação Clínica + AI Scribe

| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Upload de documentos | 🔄 | Supabase Storage + RLS + modal viewer |
| Tipos de documento | 🔄 | lab_result, prescription, treatment_plan, invoice, consent_form, intake_form |
| AI Scribe (Plaud) | ❌ | Notas de áudio → texto → SOAP note |
| Inserção no OptiMantra | ❌ | Automação via browser (sem API) |
| Compliance/integridade | ❌ | Audit trail, assinaturas digitais |

### Pilar 6: Modelo de Comunicação com IA

| Requisito | Status | Implementação |
|-----------|--------|---------------|
| Menu WhatsApp interativo | ✅ | 5 opções (consultas, agendar, cancelar, histórico, falar) |
| Confirmação por WhatsApp | ✅ | Resposta "OK/sim/yes" |
| FAQ automático | ❌ | Chatbot IA treinado com dados da clínica |
| Guiar próximos passos | ❌ | IA contextual por tipo de paciente |
| Redirect para departamento | ❌ | Escalação para humano quando IA não resolve |
| Multi-canal (SMS + Email) | ❌ | Apenas WhatsApp hoje |

---

## 4. Prioridades Sugeridas (Próximas Fases)

### Fase 2A — Documentos e Brand (em andamento)
- [x] Brand Identity (Satoshi, logos, ondas, linhas decorativas)
- [x] Login pages redesign (admin + paciente)
- [🔄] Upload/visualização de documentos (DocumentViewerModal)
- [ ] Tratamentos faltantes (High Cortisol, Iron Infusions, Chelation, Peptide Therapy)

### Fase 2B — Pagamentos e E-commerce
- [ ] Integração Stripe (depósitos + pagamentos)
- [ ] Catálogo de produtos/suplementos
- [ ] Checkout no portal do paciente
- [ ] Memberships/assinaturas

### Fase 2C — IA e Automação Avançada
- [ ] Chatbot IA no WhatsApp (Claude API)
- [ ] AI Scribe integração (Plaud → SOAP → OptiMantra)
- [ ] Nurturing sequences (follow-up automatizado)
- [ ] Recomendações personalizadas

### Fase 3 — Integrações e Polimento
- [ ] OptiMantra sync (automação de browser)
- [ ] SMS/Email (Twilio + Resend)
- [ ] Domínio + SSL (HTTPS)
- [ ] Testes automatizados + CI/CD
- [ ] Relatórios e analytics

---

## 5. Tipos de Documentos que o Sistema Opera

### Documentos Clínicos (via OptiMantra + nosso storage)
| Tipo | Origem | No nosso sistema |
|------|--------|-----------------|
| SOAP Notes (prontuário) | OptiMantra + AI Scribe | Visualização (futuro) |
| Lab Results (exames) | LabCorp/Quest → OptiMantra | Upload + visualização ✅ |
| Prescriptions (receitas) | OptiMantra/SureScripts | Upload + visualização ✅ |
| Treatment Plans | Médico cria | Upload + visualização ✅ |
| Consent Forms | Assinados pelo paciente | Upload + visualização ✅ |
| Intake Forms | Preenchidos pelo paciente | Upload + visualização ✅ |

### Documentos Financeiros
| Tipo | Origem | No nosso sistema |
|------|--------|-----------------|
| Invoices (faturas) | OptiMantra | Upload + visualização ✅ |
| Superbills | OptiMantra | Não gerenciado |
| Insurance Claims | OptiMantra | Não gerenciado |
| Recibos de pagamento | Stripe (futuro) | A implementar |

### Comunicações
| Tipo | Canal | No nosso sistema |
|------|-------|-----------------|
| Lembretes de consulta | WhatsApp | ✅ Implementado |
| Confirmações | WhatsApp | ✅ Implementado |
| Follow-ups pós-consulta | WhatsApp | ❌ Pendente |
| Marketing/nurturing | Email/SMS | ❌ Pendente |

---

*Última atualização: 07/02/2026*
