# 🔧 SOLUCIÓN ERROR 403 PERMISSION_DENIED

## Problema
La API Key de Firebase tiene restricciones que impiden que Electron acceda a los servicios.

## Pasos para Solucionar:

### 1. Ir a Firebase Console
- https://console.firebase.google.com/
- Proyecto: bodega-franco-frc
- Configuración del proyecto ⚙️
- Pestaña "General"

### 2. Configurar API Key
- Buscar "Claves de API" en la sección "Tu Apps"
- Copiar la API Key actual: AIzaSyDAPq38fcPq-8qtSbQ_YyTc0Vc0pqlqWV4
- Ir a: https://console.cloud.google.com/apis/credentials
- Buscar la API Key y editarla

### 3. Quitar Restricciones (Temporal)
- En "Restricciones de API", seleccionar "Ninguna"
- Guardar cambios
- Esperar 5-10 minutos a que se propague

### 4. Opción: Crear Nueva API Key
- Crear nueva API Key sin restricciones
- Actualizar en environment.ts y environment.dev.ts
- Reiniciar aplicación

## Verificación
- Token nuevo debe generarse sin error 403
- Backend debe recibir notificaciones sin SENDER_ID_MISMATCH
