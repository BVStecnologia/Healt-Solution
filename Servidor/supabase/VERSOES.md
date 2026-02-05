# Supabase - Versões em Produção

> Última atualização: 05/02/2026

## Containers

| Container | Imagem | Versão | Status |
|-----------|--------|--------|--------|
| supabase-db | supabase/postgres | 15.8.1.085 | ✅ healthy |
| supabase-kong | kong | 2.8.1 | ✅ healthy |
| supabase-auth | supabase/gotrue | v2.185.0 | ✅ healthy |
| supabase-rest | postgrest/postgrest | v14.3 | ✅ running |
| supabase-realtime | supabase/realtime | v2.72.0 | ✅ healthy |
| supabase-storage | supabase/storage-api | v1.33.5 | ✅ healthy |
| supabase-imgproxy | darthsim/imgproxy | v3.30.1 | ✅ healthy |
| supabase-meta | supabase/postgres-meta | v0.95.2 | ✅ healthy |
| supabase-edge-functions | supabase/edge-runtime | v1.70.0 | ✅ running |
| supabase-analytics | supabase/logflare | 1.30.3 | ✅ healthy |
| supabase-vector | timberio/vector | 0.28.1-alpine | ✅ healthy |
| supabase-pooler | supabase/supavisor | 2.7.4 | ✅ healthy |
| supabase-studio | supabase/studio | 2026.01.27 | ✅ healthy |

## Migrations Aplicadas

| Versão | Nome | Data |
|--------|------|------|
| 000 | schema_migrations | 04/02/2026 23:53 |
| 001 | scheduling_tables | 04/02/2026 23:53 |
| 002 | whatsapp_notifications | 04/02/2026 23:54 |

## Migrations Pendentes (Local)

| Versão | Nome |
|--------|------|
| 003 | admin_rls_policies |
| 004 | avatar_url |

## Edge Functions

| Função | Arquivo | Status |
|--------|---------|--------|
| main | /home/deno/functions/main | ✅ Ativo |
| hello | /home/deno/functions/hello | ✅ Ativo |

---

## Comandos de Verificação

```bash
# Ver containers
ssh clinica-vps "docker ps --filter 'name=supabase'"

# Ver migrations
ssh clinica-vps "docker exec supabase-db psql -U postgres -c 'SELECT * FROM schema_migrations;'"

# Ver logs
ssh clinica-vps "docker logs supabase-kong --tail 50"
```
