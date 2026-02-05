# Essence Medical Clinic - Projeto

**Cliente:** Essence Medical Clinic
**Início:** 04/02/2026
**Stack:** React + Supabase + Evolution API + Docker

---

## Status Atual

| Módulo | Status |
|--------|--------|
| Infraestrutura Docker | ✅ Completo |
| Portal do Paciente | ✅ Completo |
| Painel Admin | ✅ Completo |
| WhatsApp (Evolution) | ✅ Completo |
| Deploy VPS | ✅ Completo |
| IA/Chatbot | ❌ Pendente |
| E-commerce | ❌ Pendente |
| Integrações externas | ❌ Pendente |

---

## O Que Foi Entregue

### Infraestrutura
- Supabase self-hosted (13 containers)
- Evolution API (3 containers)
- Portainer + Glances no VPS
- Deploy em 217.216.81.92

### Portal do Paciente
- Login/Registro (email + Google OAuth)
- Agendamento com regras de elegibilidade
- Histórico de consultas
- Seletor de idioma (PT/EN/ES)

### Painel Admin
- Dashboard com estatísticas
- Calendário (mês/semana/dia)
- CRUD de pacientes, médicos, admins
- Ficha completa do paciente
- Aprovação/rejeição de consultas
- Status WhatsApp em tempo real

### WhatsApp
- Conexão via QR Code
- Notificações automáticas (confirmação/rejeição)
- Templates de mensagem

---

## URLs de Produção

| Serviço | URL |
|---------|-----|
| Frontend | http://217.216.81.92:3000 |
| Supabase API | http://217.216.81.92:8000 |
| Supabase Studio | http://217.216.81.92:3001 |
| Evolution API | http://217.216.81.92:8082 |
| Portainer | http://217.216.81.92:9000 |
| Glances | http://217.216.81.92:61208 |

---

## Credenciais

### Portainer
- User: `admin`
- Pass: `2026projectessence@`

### VPS SSH
```bash
ssh clinica-vps
# ou
ssh -i ~/.ssh/clinica_vps root@217.216.81.92
```

---

## Pendente (Fase 2)

| Feature | Estimativa |
|---------|------------|
| Lembretes automáticos (cron) | ~20h |
| Chatbot IA WhatsApp | ~50h |
| E-commerce (produtos) | ~60h |
| Sistema de pagamentos | ~40h |
| Integração OptiMantra | ~50h |
| Memberships | ~30h |

---

## Arquivos Importantes

| Arquivo | Função |
|---------|--------|
| `CLAUDE.md` | Documentação técnica completa |
| `frontend/.env` | Variáveis do frontend |
| `supabase/.env` | Variáveis do Supabase |
| `evolution/.env` | Variáveis da Evolution API |

---

*Atualizado: 05/02/2026*
