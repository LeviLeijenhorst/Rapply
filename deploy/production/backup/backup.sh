#!/usr/bin/env sh
set -eu

if [ -z "${1:-}" ]; then
  echo "Usage: ./backup.sh <postgres_container_name> [output_dir]"
  exit 1
fi

POSTGRES_CONTAINER="$1"
OUTPUT_DIR="${2:-./backups}"

mkdir -p "$OUTPUT_DIR"

TS="$(date -u +%Y%m%d_%H%M%S)"
FILE="$OUTPUT_DIR/coachscribe_${TS}.sql.gz"

echo "Creating backup: $FILE"
docker exec "$POSTGRES_CONTAINER" pg_dump -U postgres -d postgres | gzip > "$FILE"

echo "Done."

