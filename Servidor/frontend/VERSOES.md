# Frontend - Versões em Produção

> Última atualização: 05/02/2026

## Git

| Campo | Valor |
|-------|-------|
| **Commit** | cacd5a6 |
| **Branch** | main |
| **Data** | 04/02/2026 20:53 |
| **Mensagem** | feat: Docker unificado + controle de migrações + WhatsApp notifications |

## Commits Pendentes (Local → VPS)

| Commit | Mensagem |
|--------|----------|
| 3cea238 | docs: simplificar documentação (6 → 3 arquivos) |
| 557735f | chore: Remover settings.local.json do rastreamento |
| 1ae8afd | chore: Atualizar .gitignore |
| 48ae838 | chore: Atualização de configuração Docker |
| f808606 | style: Redesign luxuoso da página de Pacientes |
| 39d2d28 | feat: Página de Consultas admin com design luxuoso |
| 927d652 | feat: Dashboard admin com gráficos + RLS para admins |
| 736456e | fix: Evolution API key fallback em todos os arquivos |
| a9f9679 | fix: WhatsApp API key fallback + melhorias páginas admin |

**Total: 9 commits atrás**

## Dependências Principais

| Pacote | Versão |
|--------|--------|
| react | 18.x |
| typescript | 5.x |
| styled-components | 6.x |
| react-big-calendar | 1.x |
| @supabase/supabase-js | 2.x |
| lucide-react | 0.x |

## Build

| Campo | Valor |
|-------|-------|
| Modo | Production |
| Pasta | /root/Clinica/frontend/build |
| Servidor | serve -s (porta 3000) |

---

## Comandos de Verificação

```bash
# Ver commit atual no VPS
ssh clinica-vps "cd /root/Clinica && git log -1 --oneline"

# Ver diferença com local
ssh clinica-vps "cd /root/Clinica && git fetch && git log HEAD..origin/main --oneline"

# Rebuild
ssh clinica-vps "cd /root/Clinica/frontend && npm install && npm run build"
```
