#!/usr/bin/env bash
# Preparação única da VM (Debian ou Ubuntu). Rode como root:
#   sudo bash setup-vm.sh "ssh-ed25519 AAAA... appgym-deploy"
#
# Instala Docker, cria o usuário "deploy" (usado pelo GitHub Actions),
# a pasta /opt/appgym, swap e o backup diário. Pode ser rodado de novo.
set -euo pipefail

pubkey="${1:?uso: sudo bash setup-vm.sh \"<chave pública do deploy>\"}"
[ "$(id -u)" -eq 0 ] || { echo "rode com sudo"; exit 1; }

# shellcheck source=/dev/null
. /etc/os-release
case "$ID" in debian|ubuntu) ;; *) echo "sistema não suportado: $ID"; exit 1 ;; esac

echo "== Docker"
if ! command -v docker > /dev/null; then
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$ID $VERSION_CODENAME stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
apt-get install -y curl cron
systemctl enable --now docker cron

echo "== Usuário deploy"
id deploy > /dev/null 2>&1 || useradd -m -s /bin/bash deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
grep -qxF "$pubkey" /home/deploy/.ssh/authorized_keys || echo "$pubkey" >> /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

echo "== /opt/appgym"
install -d -m 750 -o deploy -g deploy /opt/appgym /opt/appgym/backups

echo "== Swap"
if [ -z "$(swapon --show --noheadings)" ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "== Backup diário (03:00 no fuso da VM, que no GCP é UTC; mantém 7)"
cat > /etc/cron.d/appgym-backup << 'EOF'
0 3 * * * deploy [ -f /opt/appgym/backup.sh ] && /bin/bash /opt/appgym/backup.sh daily 7 >> /opt/appgym/backups/backup.log 2>&1
EOF
chmod 644 /etc/cron.d/appgym-backup

echo
echo "Pronto. Falta criar /opt/appgym/.env (modelo em deploy/env.example):"
echo "  sudo -u deploy nano /opt/appgym/.env && sudo chmod 600 /opt/appgym/.env"
