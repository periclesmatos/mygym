#!/bin/sh
# Desenvolvimento: recompila ao salvar e o Spring DevTools reinicia a API sozinho.
set -e
cd "$(dirname "$0")"

mvn -q -B compile
touch target/.dev-stamp

(
  while true; do
    sleep 1
    if [ -n "$(find src -newer target/.dev-stamp -type f 2>/dev/null | head -n 1)" ]; then
      touch target/.dev-stamp
      echo "[dev] mudança detectada, recompilando..."
      if mvn -q -B -o compile; then echo "[dev] compilado, reiniciando a API"; else echo "[dev] erro de compilação"; fi
    fi
  done
) &

exec mvn -B spring-boot:run
