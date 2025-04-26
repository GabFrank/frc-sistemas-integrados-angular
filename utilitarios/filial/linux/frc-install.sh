#!/bin/bash

# Define variables
APPIMAGE_URL="https://github.com/GabFrank/frc-sistemas-integrados-angular/releases/latest/download/FRC.AppImage"
ICON_URL="https://github.com/GabFrank/frc-sistemas-integrados-angular/releases/download/2.2.1/frc.png"
INSTALL_DIR="/home/$USER/FRC"
DESKTOP_FILE="/usr/share/applications/frc.desktop"

# Step 0: Download the .AppImage
mkdir -p "$INSTALL_DIR"
curl -L "$APPIMAGE_URL" -o "$INSTALL_DIR/FRC.AppImage"

# Step 1: Make the .AppImage executable
chmod +x "$INSTALL_DIR/FRC.AppImage"

# Step 2: Create configuracion.json if it doesn't exist
CONFIG_JSON="$INSTALL_DIR/configuracion.json"
if [ ! -f "$CONFIG_JSON" ]; then
    cat > "$CONFIG_JSON" << EOF
{
  "repositoryUrl": "https://github.com/GabFrank/franco-system-frontend-general.git",
  "sucursales": [
    {
      "id": 0,
      "nombre": "Servidor",
      "ip": "172.25.1.200",
      "port": "8081"
    }]
}
EOF
fi

# Step 3: Create configuracion-local.json if it doesn't exist
CONFIG_LOCAL_JSON="$INSTALL_DIR/configuracion-local.json"
if [ ! -f "$CONFIG_LOCAL_JSON" ]; then
    cat > "$CONFIG_LOCAL_JSON" << EOF
{
  "ipDefault": "localhost",
  "puertoDefault": "8082",
  "centralIp": "172.25.1.200",
  "centralPort": "8081",
  "ipCentralDefault": "172.25.1.200",
  "puertoCentralDefault": "8081",
  "printers": {
    "ticket": "ticket",
    "factura": "factura"
  },
  "local": "Caja 1",
  "precios": "EXPO, EXPO-DEPOSITO",
  "modo": "NOT"
}
EOF
fi

# Step 4: Download the icon file
curl -L "$ICON_URL" -o "$INSTALL_DIR/frc.png"

# Step 5: Create the desktop entry
if [ ! -f "$DESKTOP_FILE" ]; then
    echo "[Desktop Entry]
Type=Application
Terminal=false
Exec=$INSTALL_DIR/FRC.AppImage
Name=FRC
Comment=Sistema de gestion de Bodega Franco
Icon=$INSTALL_DIR/frc.png
Path=$INSTALL_DIR/
Categories=Utility" | sudo tee "$DESKTOP_FILE"
fi

# Update desktop database
sudo update-desktop-database
