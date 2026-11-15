#!/bin/sh
# Desenvolvimento: recompila ao salvar e o Spring DevTools reinicia a API sozinho.
set -e
cd "$(dirname "$0")"

# O container roda como root; devolve o target ao dono da pasta para a IDE conseguir compilar também.
OWNER="$(stat -c %u:%g pom.xml)"
fix_owner() { chown -R "$OWNER" target 2>/dev/null || true; }

mvn -q -B compile
touch target/.dev-stamp
fix_owner

(
  while true; do
    sleep 1
    # spring-boot:run também escreve em target (classes de teste) ao subir.
    if [ -n "$(find target ! -user "${OWNER%%:*}" -print -quit 2>/dev/null)" ]; then fix_owner; fi
    if [ -n "$(find src -newer target/.dev-stamp -type f 2>/dev/null | head -n 1)" ]; then
      touch target/.dev-stamp
      echo "[dev] mudança detectada, recompilando..."
      if mvn -q -B -o compile; then echo "[dev] compilado, reiniciando a API"; else echo "[dev] erro de compilação"; fi
      fix_owner
    fi
  done
) &

exec mvn -B spring-boot:run
