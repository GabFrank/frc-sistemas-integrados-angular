@echo off
echo Running stop.bat
call stop.bat

echo Running delete.bat
call delete.bat

echo Downloading frc-server.jar
curl -LO https://github.com/GabFrank/franco-system-backend-filial/releases/latest/download/frc-server.jar

echo Running start.bat
call start.bat

echo Done.
pause

REM icacls update-filial.bat /grant franco:(RX)
