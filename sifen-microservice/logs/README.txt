ARCHIVOS DE LOG

En esta carpeta se generarán automáticamente los archivos de log del microservicio SIFEN.

ARCHIVOS QUE SE CREAN:
- sifen.log: Logs generales del sistema
- error.log: Solo errores
- exceptions.log: Excepciones no capturadas
- rejections.log: Promesas rechazadas no manejadas

CONFIGURACIÓN:
Los logs se configuran en src/config/config.js:
- LOG_LEVEL: Nivel de logging (info, warn, error, debug)
- LOG_FILE: Ruta del archivo de log principal

ROTACIÓN:
Los archivos se rotan automáticamente cuando alcanzan 5MB
Se mantienen máximo 5 archivos por tipo

NOTA:
No elimines esta carpeta, es necesaria para el funcionamiento del sistema.
