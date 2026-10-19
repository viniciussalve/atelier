#!/usr/bin/env bash
# Servidor de desenvolvimento em segundo plano, preso à cópia do repositório onde você está.
# Uso: server.sh start [PORTA]   sobe e espera responder; se o processo morrer, mostra o log e sai com erro
#      server.sh stop [PORTA]    para o servidor que este script subiu
#      server.sh log [PORTA]     mostra o fim do log
# A porta padrão é 8080. Se ela já responde e não foi este script que subiu, escolha outra.
set -uo pipefail
cmd="${1:-start}"
port="${2:-8080}"
root="$(git rev-parse --show-toplevel)"
state="${TMPDIR:-/tmp}/atelier-dev"
mkdir -p "$state"
key="$(printf '%s' "$root" | cksum | cut -d' ' -f1)-$port"
pidfile="$state/$key.pid"
log="$state/$key.log"

responding() { curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:$port/"; }
alive() { [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2> /dev/null; }

case "$cmd" in
  start)
    if alive && responding; then
      echo "ok: já estava rodando em http://127.0.0.1:$port/ (log: $log)"
      exit 0
    fi
    if responding; then
      echo "a porta $port já responde, mas não foi este script que subiu o servidor: use outra porta" >&2
      exit 1
    fi
    cd "$root"
    # O vite está em node_modules/.bin, que só entra no PATH dentro do npm run.
    PATH="$root/node_modules/.bin:$PATH" setsid nohup node scripts/with-app-env.mjs \
      vite dev --host 0.0.0.0 --port "$port" --strictPort > "$log" 2>&1 < /dev/null &
    echo $! > "$pidfile"
    for _ in $(seq 1 90); do
      if responding; then
        echo "ok: http://127.0.0.1:$port/ respondendo (log: $log)"
        exit 0
      fi
      if ! alive; then
        echo "o servidor saiu antes de responder. Fim do log:" >&2
        tail -20 "$log" >&2
        exit 1
      fi
      sleep 1
    done
    echo "o servidor não respondeu em 90 s. Fim do log:" >&2
    tail -20 "$log" >&2
    exit 1
    ;;
  stop)
    if alive; then
      kill -- -"$(cat "$pidfile")" 2> /dev/null || kill "$(cat "$pidfile")"
      rm -f "$pidfile"
      echo "ok: servidor da porta $port parado"
    else
      rm -f "$pidfile"
      echo "nada a parar na porta $port"
    fi
    ;;
  log)
    tail -40 "$log"
    ;;
  *)
    echo "uso: server.sh start|stop|log [PORTA]" >&2
    exit 2
    ;;
esac
