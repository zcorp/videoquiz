#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

printf 'Starting Video Quiz demo at http://localhost:4174\n'
printf 'Stop with Ctrl+C or: docker compose -f docker-compose.demo.yml down\n\n'

docker compose -f docker-compose.demo.yml up --build
