#!/usr/bin/env bash
# Checagens rápidas antes de cada commit: typecheck, lint, testes e Prettier
# só nos arquivos alterados (desde BASE, padrão HEAD, mais os não rastreados).
# Uso: check.sh [BASE]
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
base="${1:-HEAD}"
logs="$(mktemp -d)"
fail=0

run() {
  local name="$1"
  shift
  if "$@" > "$logs/$name.log" 2>&1; then
    echo "ok    $name"
  else
    echo "FALHA $name  (log completo: $logs/$name.log)"
    tail -25 "$logs/$name.log" | sed 's/^/      /'
    fail=1
  fi
}

run typecheck npm run typecheck
run lint npm run lint
run test npm test
grep -E "^# (pass|fail)" "$logs/test.log" | paste -sd' ' - | sed 's/^/      testes: /'

changed="$( {
  git diff --name-only --diff-filter=ACMR "$base"
  git ls-files --others --exclude-standard
} | grep -E '\.(ts|tsx|mjs|cjs|js|css|md|json)$' | sort -u)"
if [ -n "$changed" ]; then
  # shellcheck disable=SC2086
  run prettier npx prettier --check $changed
else
  echo "ok    prettier (nada alterado)"
fi

exit $fail
