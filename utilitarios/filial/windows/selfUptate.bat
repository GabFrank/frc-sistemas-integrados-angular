@ECHO OFF
SET "SERVICE_NAME=frc-server"
SET "NEW_JAR_PATH=C:\FRC\frc-server\frc-server-update.jar"
SET "JAR_PATH=C:\FRC\frc-server\frc-server.jar"

REM Stop the service
NET STOP "%SERVICE_NAME%"

REM Wait for the service to stop
:LOOP
SC QUERY "%SERVICE_NAME%" | FIND "STOPPED"
IF ERRORLEVEL 1 (
    TIMEOUT /T 5
    GOTO LOOP
)

REM Delete the old JAR file
DEL "%JAR_PATH%"

REM Rename the new JAR file
MOVE "%NEW_JAR_PATH%" "%JAR_PATH%"

REM Start the service
NET START "%SERVICE_NAME%"

EXIT

