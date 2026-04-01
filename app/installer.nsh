!macro customInit
  ; In silent mode (auto-update), Electron already coordinates shutdown.
  ; For manual installer runs, force-close any running instance.
  ${IfNot} ${Silent}
    ExecWait 'taskkill /F /IM "FRC.exe" /T'
    Sleep 2000
  ${EndIf}
!macroend
