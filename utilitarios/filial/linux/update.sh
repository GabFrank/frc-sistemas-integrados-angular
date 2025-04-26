#!/bin/bash
# sudo chmod +x update.sh

echo "Stopping frc service..."
sudo systemctl stop frc

echo "Deleting existing frc-server.jar..."
sudo rm frc-server.jar

echo "Downloading latest frc-server.jar..."
sudo curl -LO https://github.com/GabFrank/franco-system-backend-filial/releases/latest/download/frc-server.jar

echo "Re-enabling frc service..."
sudo systemctl reenable frc

echo "Starting frc service and following logs..."
sudo systemctl start frc && journalctl -f -u frc

echo "Done."