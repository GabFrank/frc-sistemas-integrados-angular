#!/bin/bash

SERVICE_NAME=frc
NEW_JAR_PATH=/home/franco/FRC/frc-server/frc-server-update.jar
CURRENT_JAR_PATH=/home/franco/FRC/frc-server/frc-server.jar
BACKUP_JAR_PATH=/home/franco/FRC/frc-server/frc-server-backup.jar

# Backup the current jar
mv "$CURRENT_JAR_PATH" "$BACKUP_JAR_PATH"

# Replace with the new jar
mv "$NEW_JAR_PATH" "$CURRENT_JAR_PATH"

# Try to start the service
/bin/sudo /bin/systemctl restart "$SERVICE_NAME" && journalctl -f -u "$SERVICE_NAME"