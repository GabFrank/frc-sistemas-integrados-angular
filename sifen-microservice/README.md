# SIFEN Microservice

Microservicio para generación y envío de DTEs (Documentos Tributarios Electrónicos) a SIFEN Paraguay.

## Características

- ✅ Generación de XMLs DTE según especificación SIFEN
- ✅ Firma digital con certificados .pfx
- ✅ Envío de lotes a SIFEN
- ✅ Consulta de estado de lotes
- ✅ Registro de eventos DTE (cancelación, conformidad, etc.)
- ✅ Sistema de logging robusto
- ✅ Manejo de errores y reintentos
- ✅ API REST completa

## Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd sifen-microservice
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar certificado**
   - Coloca tu archivo `.pfx` en la carpeta `certificates/`
   - Actualiza la configuración en `src/config/config.js`

4. **Configurar variables de entorno**
   - Crea un archivo `.env` basado en el ejemplo
   - Actualiza las URLs de SIFEN según tu entorno

## Configuración

### Certificado Digital

1. Coloca tu archivo `.pfx` en `certificates/`
2. Actualiza la ruta y contraseña en `src/config/config.js`:

```javascript
certificate: {
  path: './certificates/tu-certificado.pfx',
  password: 'tu-contraseña-aqui'
}
```

### URLs de SIFEN

Actualiza las URLs según tu entorno:

```javascript
sifen: {
  baseUrl: 'https://ekuatia.set.gov.py', // Producción
  testUrl: 'https://ekuatia.set.gov.py',  // Pruebas
  // ...
}
```

## Uso

### Iniciar el servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

### Endpoints disponibles

- `GET /` - Información del servicio
- `GET /api/health` - Estado de salud
- `POST /api/generar` - Generar DTE
- `POST /api/enviar-lote` - Enviar lote de DTEs
- `GET /api/consultar-lote/:protocoloId` - Consultar estado de lote
- `POST /api/registrar-evento` - Registrar evento DTE

### Ejemplo de uso

```bash
# Generar DTE
curl -X POST http://localhost:3001/api/generar \
  -H "Content-Type: application/json" \
  -d '{"facturaLegalId": 123, "sucursalId": 1}'

# Enviar lote
curl -X POST http://localhost:3001/api/enviar-lote \
  -H "Content-Type: application/json" \
  -d '{"xmls": ["<xml1>", "<xml2>"]}'
```

## Estructura del Proyecto

```
sifen-microservice/
├── src/
│   ├── config/          # Configuración
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades
│   ├── routes/          # Rutas de la API
│   └── index.js         # Servidor principal
├── certificates/         # Certificados digitales
├── logs/                # Archivos de log
├── package.json
└── README.md
```

## Desarrollo

### Scripts disponibles

- `npm start` - Iniciar servidor
- `npm run dev` - Iniciar en modo desarrollo con nodemon
- `npm test` - Ejecutar tests

### Logs

Los logs se guardan en la carpeta `logs/`:
- `sifen.log` - Logs generales
- `error.log` - Solo errores
- `exceptions.log` - Excepciones no capturadas

## Integración con Backend

Este microservicio se integra con tu backend Spring Boot a través de:

1. **DteNodeClient** - Cliente HTTP para comunicación
2. **Configuración** - URLs y timeouts configurables
3. **Manejo de errores** - Reintentos automáticos y logging

## Próximos Pasos

1. **Configurar certificado real** - Reemplazar datos mock
2. **Integrar con base de datos** - Obtener datos reales de facturas
3. **Implementar validaciones SIFEN** - Validar XMLs antes del envío
4. **Monitoreo** - Métricas y alertas
5. **Tests** - Cobertura completa de tests

## Soporte

Para soporte técnico o preguntas, contacta al equipo de desarrollo.
