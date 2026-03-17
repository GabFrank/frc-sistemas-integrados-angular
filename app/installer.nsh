!macro customInit
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
