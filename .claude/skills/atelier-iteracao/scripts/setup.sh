#!/usr/bin/env bash
# Prepara o Atelier para desenvolver. Idempotente: rode ao começar cada iteração.
# - instala dependências (o npm puro trava num bug do arborist; --legacy-peer-deps contorna)
# - cria .grok/app-env.json local (arquivo de plataforma, fora do git; três testes dependem dele)
# - copia substitutos vazios dos arquivos de plataforma que faltam (sem eles o dev não sobe)
# - tira do git o package-lock.json gerado e esses substitutos
set -euo pipefail
stubs="$(cd "$(dirname "$0")" && pwd)/stubs"
cd "$(git rev-parse --show-toplevel)"

if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  npm install --legacy-peer-deps --no-audit --no-fund
fi

mkdir -p .grok
[ -f .grok/app-env.json ] || printf '{"VITE_AUTH_ENABLED":"false"}\n' > .grok/app-env.json

exclude="$(git rev-parse --git-path info/exclude)"
mkdir -p "$(dirname "$exclude")"
grep -qxF package-lock.json "$exclude" 2>/dev/null || echo package-lock.json >> "$exclude"

# A plataforma fornece os reais; se já estiverem aqui, ficam.
for target in src/lib/preview-host-bridge.ts scripts/grok-pwa-plugin.mjs; do
  [ -f "$target" ] || cp "$stubs/$(basename "$target")" "$target"
  grep -qxF "$target" "$exclude" 2>/dev/null || echo "$target" >> "$exclude"
done

echo "ok: dependências instaladas, .grok/app-env.json e arquivos de plataforma presentes, nada disso no git"
