#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${USAGE_IMPORT_HOST_DIR:-}" ]]; then
  echo "USAGE_IMPORT_HOST_DIR must point to the Nextcloud-synced host directory." >&2
  exit 1
fi

docker build -f Dockerfile.importer -t nfe-usage-importer .
docker run --rm \
  -e SUPABASE_URL \
  -e SUPABASE_SERVICE_ROLE_KEY \
  -e USAGE_IMPORT_DIR=/data/import \
  -e USAGE_IMPORT_REPROCESS_DAYS \
  -e USAGE_IMPORT_FORCE_FULL_SYNC \
  -v "${USAGE_IMPORT_HOST_DIR}:/data/import:ro" \
  nfe-usage-importer
