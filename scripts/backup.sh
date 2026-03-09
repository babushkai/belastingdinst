#!/bin/bash
# Database backup script for belastingdinst
#
# Dutch tax law (Artikel 52 AWR) requires 7-year retention of financial records (bewaarplicht).
# This script creates daily compressed PostgreSQL backups and prunes files older than 7 years.
#
# Usage:
#   Add to crontab: 0 2 * * * /app/scripts/backup.sh
#   Or run manually: ./scripts/backup.sh
#
# Restore:
#   gunzip -c /backups/belastingdinst_YYYYMMDD_HHMMSS.sql.gz | psql $DATABASE_URL

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="belastingdinst_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup: ${FILENAME}"
pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"
echo "Backup complete: ${BACKUP_DIR}/${FILENAME}"

# Prune backups older than 7 years (2555 days)
find "$BACKUP_DIR" -name "belastingdinst_*.sql.gz" -mtime +2555 -delete
echo "Pruned backups older than 7 years"
