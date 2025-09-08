# SIFEN Microservice

Microservicio para generación de DTEs (Documentos Tributarios Electrónicos) según especificaciones de SIFEN Paraguay.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Generar XML válido para SIFEN
node generar-xml-sifen.js

# Iniciar microservicio
npm start
```

## 📋 Funcionalidades Core

- ✅ Generación de XML válido contra esquema XSD oficial
- ✅ Firma digital con certificados PKCS#12
- ✅ Validación XSD automática integrada
- ✅ Integración con pre-validador oficial de SIFEN
- ✅ API REST completa para generación y validación de facturas

## 🔧 Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/documento/generar` | Generar DTE desde datos de factura |
| `POST` | `/api/validar-xml` | Validar XML contra esquema XSD |
| `POST` | `/api/validar-xml-oficial` | Validar con pre-validador oficial SIFEN |
| `POST` | `/api/validar-xml-completo` | Validación completa (local + oficial) |
| `POST` | `/api/comparar-validaciones` | Comparar resultados de ambas validaciones |
| `GET` | `/api/esquema-info` | Información del esquema XSD |

## 🧪 Generación de XML

```bash
# Generar XML válido para SIFEN
node generar-xml-sifen.js

# Configurar certificado (opcional)
node config-certificado.js

# Ejecutar solo validación XSD local
node -e "require('./src/services/xmlValidator').getInformacionEsquema()"
```

### 📄 Archivo Principal: `generar-xml-sifen.js`

Este es el archivo principal para generar XML válido para SIFEN:

- ✅ **Genera XML válido** contra esquema XSD oficial
- ✅ **Incluye referencias XSD** para pre-validador oficial
- ✅ **Validación automática** integrada
- ✅ **Ejemplo completo** con datos de prueba
- ✅ **Comentarios detallados** en el código

**Uso:**
```bash
node generar-xml-sifen.js
```

## 📁 Estructura Limpia

```
src/
├── services/          # Servicios core
│   ├── dteGenerator.js    # Generador de DTEs
│   ├── xmlSigner.js       # Firma digital
│   ├── xmlValidator.js    # Validación XSD
│   └── sifenClient.js     # Cliente SIFEN
├── utils/             # Utilidades
│   ├── xmlBuilder.js      # Constructor de XML
│   └── logger.js          # Logging
├── routes/            # Endpoints API
│   └── api.js            # API principal
├── schemas/           # Esquemas XSD
│   └── sifen-v150.xsd    # Esquema oficial SIFEN
└── config/            # Configuración
    └── config.js          # Configuración principal
```

## ⚙️ Configuración

Archivo `.env`:
```bash
PORT=3001
CERTIFICATE_PATH=./certificates/franco-arevalos-sa.pfx
CERTIFICATE_PASSWORD=tu_password
```

## 🏗️ Arquitectura

1. **Generación**: Construye XML válido según esquema SIFEN
2. **Validación**: Verifica XML contra XSD antes de firmar
3. **Firma**: Aplica firma digital usando certificado
4. **Envío**: Envía documento a SIFEN (opcional)

## 📊 Logs

Los logs se guardan en `logs/` con rotación automática:
- `sifen-microservice.log` - Logs principales
- `error.log` - Solo errores

## 🔧 Desarrollo

```bash
# Desarrollo con recarga automática
npm run dev

# Producción
npm start
```

## 🌐 Pre-validador Oficial SIFEN

El microservicio incluye integración con el pre-validador oficial de SIFEN:

### URLs Oficiales:
- **Validador**: https://ekuatia.set.gov.py/prevalidador/validacion
- **Instructivo**: https://ekuatia.set.gov.py/prevalidador/instructivo

### Estrategias de Validación:

1. **Validación Local XSD** (Recomendada para desarrollo)
   - ✅ Rápida y confiable
   - ✅ Sin dependencias externas
   - ✅ Validación completa del esquema

2. **Validación Oficial** (Para producción)
   - ⚠️ Puede requerir interacción web completa
   - ⚠️ Dependiente de conectividad
   - ✅ Validación oficial de SIFEN

3. **Validación Completa** (Mejor opción)
   - ✅ Combina ambas validaciones
   - ✅ Mayor confiabilidad
   - ✅ Comparación de resultados

### Ejemplo de Validación Completa:

```bash
# Validar XML con ambas estrategias
curl -X POST http://localhost:3001/api/validar-xml-completo \
  -H "Content-Type: application/json" \
  -d '{"xmlContent": "<?xml version=\"1.0\"..."}'
```

## 🧹 Mantenimiento

```bash
# Limpiar logs antiguos
rm -f logs/*.log.*

# Limpiar cache de node_modules
rm -rf node_modules/.cache

# Verificar configuración del certificado
node config-certificado.js
```

## 🔧 Desarrollo Avanzado

```bash
# Ejecutar solo validación XSD local
node -e "require('./src/services/xmlValidator').getInformacionEsquema()"

# Ver logs en tiempo real
tail -f logs/sifen-microservice.log

# Probar endpoints de la API
curl http://localhost:3001/health
```
