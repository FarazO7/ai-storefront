#!/usr/bin/env bash
# Smoke test for POST /api/ask. Usage: scripts/smoke.sh [base-url]  (default: http://localhost:3000)
# The last check makes one real OpenAI call.
set -u
BASE="${1:-http://localhost:3000}"

check() { # name, JSON body, expected HTTP status, expected JSON key
  local res status
  res=$(curl -s --max-time 40 -w ' HTTP%{http_code}' -X POST "$BASE/api/ask" -H 'Content-Type: application/json' -d "$2")
  status=${res##* HTTP}
  if [[ $status == "$3" && $res == *"\"$4\":"* ]]; then
    echo "ok   $1 -> ${res% HTTP*}"
  else
    echo "FAIL $1 -> $res"
    exit 1
  fi
}

check "empty input" '{"question":"   "}' 400 error
check "501 characters" "{\"question\":\"$(printf 'a%.0s' {1..501})\"}" 400 error
check "real question" '{"question":"Suggest one digital product a fitness coach in Pune could sell, with a price in INR."}' 200 answer
echo "All checks passed."
