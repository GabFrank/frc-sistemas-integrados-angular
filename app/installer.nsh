!macro customInit
  ; Close the app if running before installing
  ExecWait 'taskkill /F /IM "FRC.exe" /T'
  Sleep 2000
!macroend
