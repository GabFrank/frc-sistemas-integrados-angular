!macro customInit
  ; Cerrar la app si esta corriendo antes de instalar
  ExecWait 'taskkill /F /IM "FRC.exe" /T'
  Sleep 3000

  ; Forzar borrado del directorio de instalacion anterior para evitar "archivo en uso"
  ; Leer ruta de instalacion desde el registro usando el GUID actual
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{9978E2AA-8509-4830-A1C2-88A34BB1D7BF}" "InstallLocation"
  ${If} $0 != ""
    RMDir /r "$0"
    Sleep 1000
  ${EndIf}

  ; Fallback: borrar por ruta por defecto si el registro no tiene la entrada
  ${If} $0 == ""
    RMDir /r "$PROGRAMFILES64\FRC"
    RMDir /r "$PROGRAMFILES\FRC"
    Sleep 1000
  ${EndIf}

  ; Desinstalar version anterior registrada con GUID "FRC" (antes de la migracion a UUID)
  ; electron-builder puede haber registrado la clave con o sin llaves
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{FRC}" "UninstallString"
  ${If} $0 != ""
    ExecWait '"$0" /S'
    Sleep 2000
  ${EndIf}

  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\FRC" "UninstallString"
  ${If} $0 != ""
    ExecWait '"$0" /S'
    Sleep 2000
  ${EndIf}
!macroend
