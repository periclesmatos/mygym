#!/bin/sh
# Desenvolvimento: recompila ao salvar e o Spring DevTools reinicia a API sozinho.
set -e
cd "$(dirname "$0")"

# O container roda como root; devolve o target ao dono da pasta para a IDE conseguir compilar também.
OWNER="$(stat -c %u:%g pom.xml)"
fix_owner() { chown -R "$OWNER" target 2>/dev/null || true; }

mvn -q -B compile
touch target/.dev-stamp

# O segredo padrão do application.yml é público (está no repositório): o dev gera o próprio.
# Fica em target/ (fora do git e da imagem); um mvn clean só obriga a entrar de novo.
if [ -z "${JWT_SECRET:-}" ]; then
  SECRET_FILE=target/.dev-jwt-secret
  if [ ! -s "$SECRET_FILE" ]; then
    (umask 077; od -An -tx1 -N48 /dev/urandom | tr -d ' \n' > "$SECRET_FILE")
  fi
  JWT_SECRET="$(cat "$SECRET_FILE")"
  export JWT_SECRET
fi
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
