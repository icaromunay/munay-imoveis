#!/usr/bin/env bash
set -euo pipefail

PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://imoveis.munay.com.br}"
NEXT_BASE_URL="${NEXT_BASE_URL:-http://127.0.0.1:3000}"
API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:4000}"
CURL_OPTS=(--silent --show-error --location --max-time 15)
FAILURES=0

red() { printf '\033[31m%s\033[0m\n' "$1"; }
green() { printf '\033[32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[33m%s\033[0m\n' "$1"; }

request() {
  local method="$1"
  local url="$2"
  local body_file="$3"
  local code

  if [[ "$method" == "POST" ]]; then
    code=$(curl "${CURL_OPTS[@]}" -o "$body_file" -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' "$url" || true)
  else
    code=$(curl "${CURL_OPTS[@]}" -o "$body_file" -w '%{http_code}' "$url" || true)
  fi

  printf '%s' "$code"
}

assert_not_routed_wrong() {
  local label="$1"
  local method="$2"
  local url="$3"
  local tmp
  tmp=$(mktemp)

  local code
  code=$(request "$method" "$url" "$tmp")
  local body
  body=$(cat "$tmp")
  rm -f "$tmp"

  if [[ "$code" == "404" ]] || grep -qi 'Rota não encontrada' <<<"$body"; then
    red "[ERRO] $label -> encaminhamento incorreto ($code)"
    printf 'URL: %s\n' "$url"
    printf 'Resposta: %s\n\n' "$body"
    FAILURES=$((FAILURES + 1))
    return
  fi

  green "[OK] $label -> HTTP $code"
  if [[ "$code" == "401" || "$code" == "403" ]]; then
    yellow "       rota protegida encontrada corretamente"
  fi
}

echo '== Verificação local do Next.js ==' 
assert_not_routed_wrong 'Next local /api/admin-token' GET "$NEXT_BASE_URL/api/admin-token"
assert_not_routed_wrong 'Next local /api/admin/email/smtp' GET "$NEXT_BASE_URL/api/admin/email/smtp"
assert_not_routed_wrong 'Next local /api/auth/session' GET "$NEXT_BASE_URL/api/auth/session"

echo
echo '== Verificação local da API Express =='
assert_not_routed_wrong 'API local /api/properties?limit=1' GET "$API_BASE_URL/api/properties?limit=1"
assert_not_routed_wrong 'API local /api/posts?limit=1' GET "$API_BASE_URL/api/posts?limit=1"
assert_not_routed_wrong 'API local /api/dashboard' GET "$API_BASE_URL/api/dashboard"

echo
echo '== Verificação pública via Nginx =='
assert_not_routed_wrong 'Público /api/admin-token' GET "$PUBLIC_BASE_URL/api/admin-token"
assert_not_routed_wrong 'Público /api/admin/email/smtp' GET "$PUBLIC_BASE_URL/api/admin/email/smtp"
assert_not_routed_wrong 'Público /api/auth/session' GET "$PUBLIC_BASE_URL/api/auth/session"
assert_not_routed_wrong 'Público /api/properties?limit=1' GET "$PUBLIC_BASE_URL/api/properties?limit=1"
assert_not_routed_wrong 'Público /api/posts?limit=1' GET "$PUBLIC_BASE_URL/api/posts?limit=1"
assert_not_routed_wrong 'Público /api/dashboard' GET "$PUBLIC_BASE_URL/api/dashboard"

echo
if [[ "$FAILURES" -gt 0 ]]; then
  red "Falha na validação de roteamento: $FAILURES erro(s)."
  echo 'Revise o Nginx, especialmente o bloco location /api/ e o uso de proxy_pass sem barra final.'
  exit 1
fi

green 'Roteamento validado com sucesso.'
