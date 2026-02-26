#!/usr/bin/env bash
set -euo pipefail

### Config ###
DB_NAME="bodega"
DB_USER="franco"
DB_HOST="localhost"
DB_PORT="5551"
REMOTE="google drive:postgres-backups"
BACKUP_DIR="/home/franco/bodega/FRC/backups/postgres"

### Prepare ###
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +'%Y-%m-%d_%H%M')
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

### 1) Dump & compress ###
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

### 2) Upload & prune remote ###
rclone copy --update "$BACKUP_FILE" "$REMOTE"
rclone delete "$REMOTE" --min-age 168h
rclone cleanup "$REMOTE"

### 3) Prune local ###
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +14 -delete