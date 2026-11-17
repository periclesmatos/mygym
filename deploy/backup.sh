#!/usr/bin/env bash
# Gera um dump comprimido do banco em /opt/appgym/backups.
# Uso: backup.sh [prefixo] [quantos manter]
#   backup.sh daily 7         (cron diário, criado pelo setup-vm.sh)
#   backup.sh pre-deploy 10   (chamado pelo deploy.sh)
set -euo pipefail

cd /opt/appgym
prefix="${1:-daily}"
keep="${2:-7}"
compose=(docker compose -f compose.prod.yml)

if [ -z "$("${compose[@]}" ps -q --status running db 2>/dev/null)" ]; then
  echo "[backup] banco não está rodando, nada a salvar"
  exit 0
fi

mkdir -p backups
file="backups/${prefix}-$(date -u +%Y%m%d-%H%M%S).sql.gz"
"${compose[@]}" exec -T db pg_dump -U appgym -d appgym | gzip > "${file}.tmp"
mv "${file}.tmp" "$file"
echo "[backup] $file ($(du -h "$file" | cut -f1))"

ls -1t backups/"${prefix}"-*.sql.gz | tail -n +"$((keep + 1))" | xargs -r rm --
