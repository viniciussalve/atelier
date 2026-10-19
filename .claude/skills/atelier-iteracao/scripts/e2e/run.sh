#!/usr/bin/env bash
# Roda um roteiro Playwright contra o servidor de desenvolvimento.
# Uso: run.sh ROTEIRO.cjs [PORTA]
set -euo pipefail
script="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
port="${2:-8080}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(git rev-parse --show-toplevel)"

export BASE_URL="http://127.0.0.1:$port/"
export SHOTS="${SHOTS:-$root/screenshots}"
export ATELIER_E2E="$here"
# Playwright global: bate com os navegadores pré-instalados em /opt/pw-browsers.
# O lib.cjs o carrega por este caminho, porque o do projeto espera outro build.
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
export ATELIER_PLAYWRIGHT="${ATELIER_PLAYWRIGHT:-$(npm root -g)/playwright}"
# Sem isto o Chromium manda o próprio localhost pelo proxy do ambiente.
export PLAYWRIGHT_DISABLE_FORCED_CHROMIUM_PROXIED_LOOPBACK=1

mkdir -p "$SHOTS"
cd "$here"
exec node "$script"
