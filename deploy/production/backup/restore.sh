#!/usr/bin/env sh
set -eu

if [ -z "${1:-}" ] || [ -z "${2:-}" ]; then
  echo "Usage: ./restore.sh <postgres_container_name> <backup_file.sql.gz>"
  exit 1
fi

POSTGRES_CONTAINER="$1"
BACKUP_FILE="$2"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d postgres

echo "Done."

