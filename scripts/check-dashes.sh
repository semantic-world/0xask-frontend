#!/usr/bin/env bash
# House rule: no em dashes and no en dashes anywhere in this repository.

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

matches=$(
  grep -rnP '[\x{2013}\x{2014}]' "$root" \
    --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=out \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude='*.png' --exclude='*.jpg' --exclude='*.ico' \
    --exclude='*.woff' --exclude='*.woff2' \
    --exclude='package-lock.json' \
    --exclude='check-dashes.sh' \
    || true
)

if [ -n "$matches" ]; then
  echo "Em dash or en dash found. House rule violation:"
  echo "$matches"
  exit 1
fi

echo "Dash check passed."
