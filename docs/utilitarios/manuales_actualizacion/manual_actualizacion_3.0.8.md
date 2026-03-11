-- Servidor

-- sucursal
- reemplazar FRC.AppImage
rm /home/franco/FRC/FRC.AppImage
curl -L -o /home/franco/FRC/FRC.AppImage https://github.com/GabFrank/frc-sistemas-integrados-angular/releases/download/3.0.6/FRC.AppImage
sudo chmod a+x /home/franco/FRC/FRC.AppImage

- reemplazar frc-server.jar
rm /home/franco/FRC/frc-server/frc-server.jar
curl -L -o /home/franco/FRC/frc-server/frc-server.jar https://github.com/GabFrank/franco-system-backend-filial/releases/download/3.0.6/frc-server.jar

- adicionar en application properties
mkdir /home/franco/FRC/backups
mkdir /home/franco/FRC/backups/postgres

sudo tee -a /home/franco/FRC/frc-server/application.properties <<EOF
backup.enabled=false
backup.local-path=/home/franco/FRC/backups/postgres
backup.google-drive.folder-id=
backup.google-drive.client-id=
backup.google-drive.client-secret=
backup.max-files=5
backup.backup-hour=2
EOF

- verificar si fue actualizado el archivo
tail -n 10 /home/franco/FRC/frc-server/application.properties

- reiniciar el servidor
sudo systemctl restart frc && journalctl -f -u frc

- en la configuracion del sistema:
tail /home/franco/FRC/configuracion-local.json -n 20
ip servidor: 159.203.86.103
ver pdvId en configuracion-local.json
