# Evolution API - Versões em Produção

> Última atualização: 05/02/2026

## Containers

| Container | Imagem | Versão | Status |
|-----------|--------|--------|--------|
| evolution_api | evoapicloud/evolution-api | v2.3.6 | ✅ running |
| evolution_db | postgres | 15-alpine | ✅ healthy |
| evolution_redis | redis | 7-alpine | ✅ running |

## Configuração

| Variável | Valor |
|----------|-------|
| SERVER_URL | http://217.216.81.92:8082 |
| AUTHENTICATION_API_KEY | *** (configurada) |
| DATABASE_URL | postgres://evolution_db:5432 |
| REDIS_URL | redis://evolution_redis:6379 |

## Instâncias WhatsApp

Para ver instâncias ativas:
```bash
curl http://217.216.81.92:8082/instance/fetchInstances \
  -H "apikey: SUA_API_KEY"
```

---

## Comandos de Verificação

```bash
# Ver containers
ssh clinica-vps "docker ps --filter 'name=evolution'"

# Ver logs
ssh clinica-vps "docker logs evolution_api --tail 50"

# Testar API
curl http://217.216.81.92:8082/
```
