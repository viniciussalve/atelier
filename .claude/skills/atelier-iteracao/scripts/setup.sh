#!/usr/bin/env bash
# Prepara o Atelier para desenvolver. Idempotente: rode ao começar cada iteração.
# - instala dependências (o npm puro trava num bug do arborist; --legacy-peer-deps contorna)
# - cria .grok/app-env.json local (arquivo de plataforma, fora do git; três testes dependem dele)
# - tira o package-lock.json gerado do git
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  npm install --legacy-peer-deps --no-audit --no-fund
fi

mkdir -p .grok
[ -f .grok/app-env.json ] || printf '{"VITE_AUTH_ENABLED":"false"}\n' > .grok/app-env.json

exclude="$(git rev-parse --git-path info/exclude)"
mkdir -p "$(dirname "$exclude")"
grep -qxF package-lock.json "$exclude" 2>/dev/null || echo package-lock.json >> "$exclude"

echo "ok: dependências instaladas, .grok/app-env.json presente, package-lock.json fora do git"
