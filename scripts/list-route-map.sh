#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo '=== Rotas Next.js (apps/web/app/api/**) ==='
for file in $(find apps/web/app/api -type f -name 'route.ts' | sort); do
  route="${file#apps/web/app}"
  route="${route%/route.ts}"
  methods=$(grep -E "export async function|export const \{ GET, POST \}" "$file" | sed -E 's/.*function ([A-Z]+).*/\1/; s/.*\{ GET, POST \}.*/GET, POST/' | paste -sd ', ' -)
  if [[ -z "$methods" ]]; then
    methods='(métodos não detectados automaticamente)'
  fi
  printf '%-65s %s\n' "$route" "$methods"
done

echo
echo '=== Montagens Express (apps/api/src/app.ts) ==='
grep -nE "app.use\('/api|app.use\('/uploads|app.get\('/api/health" apps/api/src/app.ts | sed -E "s/^[0-9]+://"

echo
echo '=== Endpoints Express (apps/api/src/routes/**) ==='
for file in $(find apps/api/src/routes -maxdepth 1 -type f | sort); do
  echo "-- ${file#apps/api/src/routes/} --"
  awk '{print NR":"$0}' "$file" | grep -E "router\.(get|post|put|patch|delete)\(|^[0-9]+:\s*['\"]/" -A1 | sed '/^--$/d' | sed 's/^/   /'
  echo
done
