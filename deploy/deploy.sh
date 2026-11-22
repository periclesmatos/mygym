#!/usr/bin/env bash
# Publica uma imagem na VM. Chamado pelo deploy.yml via SSH.
# Uso: deploy.sh <tag-da-imagem>   (ex. sha-<commit>)
#
# 1. backup do banco  2. sobe a imagem nova  3. espera o /api/health
# 4. se não ficar saudável, volta para a imagem anterior e sai com erro.
# 5. recarrega o Caddy, que não percebe sozinho mudança no Caddyfile.
set -euo pipefail

cd /opt/appgym
new_tag="${1:?uso: deploy.sh <tag-da-imagem>}"
compose=(docker compose -f compose.prod.yml)
state_file=.image_tag
# Direto no app: na porta 80 o Caddy responde redirect, que o curl -f aceita como sucesso.
health_url=http://127.0.0.1:8080/api/health
health_tries=90 # x 2 s = 3 min (a JVM demora numa VM pequena)

log() { echo "[deploy] $*"; }

[ -f .env ] || { log "falta /opt/appgym/.env (modelo em deploy/env.example)"; exit 1; }
for var in POSTGRES_PASSWORD JWT_SECRET APP_USER_EMAIL APP_USER_PASSWORD; do
  grep -qE "^${var}=.+" .env || { log "$var não está definido no .env"; exit 1; }
done

wait_healthy() {
  for _ in $(seq 1 "$health_tries"); do
    curl -fsS "$health_url" > /dev/null 2>&1 && return 0
    sleep 2
  done
  return 1
}

reload_caddy() {
  # Algumas tentativas porque o container pode ter acabado de subir.
  for _ in $(seq 1 10); do
    "${compose[@]}" exec -T caddy caddy reload --config /etc/caddy/Caddyfile < /dev/null && return 0
    sleep 2
  done
  return 1
}

up() {
  IMAGE_TAG="$1" "${compose[@]}" pull --quiet app
  IMAGE_TAG="$1" "${compose[@]}" up -d --remove-orphans
}

prev_tag="$(cat "$state_file" 2>/dev/null || true)"
log "atual: ${prev_tag:-nenhuma} -> nova: $new_tag"

# Flyway roda as migrations no boot e elas só vão para a frente:
# o backup é o caminho de volta se uma migration der errado.
bash ./backup.sh pre-deploy 10

up "$new_tag"
if wait_healthy; then
  echo "$new_tag" > "$state_file"
  if ! reload_caddy; then
    log "ERRO: $new_tag subiu, mas o Caddy não aceitou o Caddyfile. Últimos logs:"
    "${compose[@]}" logs --tail 50 caddy || true
    exit 1
  fi
  docker image prune -af --filter "until=168h" > /dev/null || true
  log "ok: $new_tag no ar"
  exit 0
fi

log "ERRO: $new_tag não respondeu em $health_url. Últimos logs:"
IMAGE_TAG="$new_tag" "${compose[@]}" logs --tail 100 app || true

if [ -n "$prev_tag" ] && [ "$prev_tag" != "$new_tag" ]; then
  log "voltando para $prev_tag"
  up "$prev_tag"
  if wait_healthy; then
    log "rollback ok: $prev_tag no ar"
  else
    log "ERRO: rollback para $prev_tag também não respondeu"
  fi
fi
exit 1
