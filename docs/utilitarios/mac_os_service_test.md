
<!-- Crear el archivo para launchtl filial -->
sudo tee /Library/LaunchDaemons/com.franco.frc.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN"
    "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <!-- A unique label -->
    <key>Label</key>
    <string>com.franco.frc</string>

    <!-- What to run -->
    <key>ProgramArguments</key>
    <array>
      <string>/usr/bin/java</string>
      <string>-jar</string>
      <string>/Users/gabfranck/workspace/sucursal/FRC/frc-server/frc-server.jar</string>
    </array>

    <!-- Working directory -->
    <key>WorkingDirectory</key>
    <string>/Users/gabfranck/workspace/sucursal/FRC/frc-server</string>

    <!-- Start at boot -->
    <key>RunAtLoad</key>
    <true/>

    <!-- Keep it alive if it exits -->
    <key>KeepAlive</key>
    <true/>

    <!-- Redirect stdout/stderr -->
    <key>StandardOutPath</key>
    <string>/tmp/frc.out.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/frc.err.log</string>
  </dict>
</plist>
EOF

<!-- crear archivo para servidor -->
sudo tee /Library/LaunchDaemons/com.franco.frc-servidor.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN"
    "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <!-- A unique label -->
    <key>Label</key>
    <string>com.franco.frc-servidor</string>

    <!-- What to run -->
    <key>ProgramArguments</key>
    <array>
      <string>/usr/bin/java</string>
      <string>-jar</string>
      <string>/Users/gabfranck/workspace/bodega/FRC/frc-server/frc-server.jar</string>
    </array>

    <!-- Working directory -->
    <key>WorkingDirectory</key>
    <string>/Users/gabfranck/workspace/bodega/FRC/frc-server</string>

    <!-- Start at boot -->
    <key>RunAtLoad</key>
    <false/>

    <!-- Keep it alive if it exits, what does this means? Response:  -->
    <key>KeepAlive</key>
    <true/>

    <!-- Redirect stdout/stderr -->
    <key>StandardOutPath</key>
    <string>/tmp/frc-servidor.out.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/frc-servidor.err.log</string>
  </dict>
</plist>
EOF

<!-- Dar permisos y cargar filial-->
sudo chown root:wheel /Library/LaunchDaemons/com.franco.frc.plist
sudo chmod 644   /Library/LaunchDaemons/com.franco.frc.plist
sudo launchctl unload /Library/LaunchDaemons/com.franco.frc.plist 2>/dev/null
sudo launchctl load   /Library/LaunchDaemons/com.franco.frc.plist

<!-- Dar permisos y cargar servidor-->
sudo chown root:wheel /Library/LaunchDaemons/com.franco.frc-servidor.plist
sudo chmod 644   /Library/LaunchDaemons/com.franco.frc-servidor.plist
sudo launchctl unload /Library/LaunchDaemons/com.franco.frc-servidor.plist 2>/dev/null
sudo launchctl load   /Library/LaunchDaemons/com.franco.frc-servidor.plist

<!-- Iniciar y parar -->
sudo launchctl start  com.franco.frc && tail -f /tmp/frc.out.log
sudo launchctl stop  com.franco.frc

<!-- Iniciar y parar servidor-->
sudo launchctl start  com.franco.frc-servidor && tail -f /tmp/frc-servidor.out.log
sudo launchctl stop  com.franco.frc-servidor

<!-- logs -->
tail -f /tmp/frc.out.log

<!-- logs servidor-->
tail -f /tmp/frc-servidor.out.log
