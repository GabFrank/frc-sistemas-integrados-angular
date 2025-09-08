# 🔐 Configuración del Certificado Real CODE100 para SIFEN

## 📋 Requisitos Previos

Antes de configurar el certificado real, asegúrate de tener:

### ✅ Firma Digital (Certificado Digital)
- Archivo `.pfx` o `.p12` emitido por CODE100
- Contraseña del certificado

### ✅ CSC (Código de Seguridad)
- Código CSC proporcionado por SIFEN
- PIN del CSC

## 🚀 Configuración Paso a Paso

### 1. Preparar el Entorno

```bash
# Crear directorio para certificados
mkdir -p certificates

# Copiar archivo de configuración
cp config-example.env .env
```

### 2. Colocar el Certificado

```bash
# Copiar tu certificado al directorio certificates/
cp /ruta/a/tu/certificado.pfx ./certificates/
```

### 3. Configurar Variables de Entorno

Edita el archivo `.env` con tus datos reales:

```bash
# Configuración del Certificado Digital
CERTIFICATE_PATH=./certificates/tu-certificado.pfx
CERTIFICATE_PASSWORD=tu_contraseña_real

# Configuración del CSC
CSC_CODE=tu_codigo_csc_de_sifen
CSC_PIN=tu_pin_del_csc

# Cambiar a ambiente de producción (opcional)
SIFEN_BASE_URL=https://sifen.set.gov.py
```

### 4. Probar la Configuración

```bash
# Ejecutar prueba del certificado
node test-certificado-real.js
```

## 📊 Verificación de Estado

El script de prueba mostrará:

```
🔐 Probando carga del certificado real...

📋 Configuración actual:
   📁 Certificado: ./certificates/tu-certificado.pfx
   🔑 CSC Code: Configurado
   📌 CSC PIN: Configurado

✅ Archivo del certificado encontrado
🔄 Intentando cargar certificado...
✅ Certificado cargado exitosamente
   📜 Emisor: CODE100 S.A.
   🏢 Sujeto: FRANCO AREVALOS S.A.
   📅 Válido desde: 2024-09-01
   📅 Válido hasta: 2025-09-01

✅ CSC configurado correctamente

🎯 Estado del sistema:
   📜 Certificado: ✅ Listo
   🔐 CSC: ✅ Listo

🎉 ¡Sistema listo para facturación electrónica real!
```

## 🔧 Solución de Problemas

### ❌ "Certificado no encontrado"
```bash
# Verificar que el archivo existe
ls -la certificates/

# Verificar ruta en .env
cat .env | grep CERTIFICATE_PATH
```

### ❌ "Contraseña incorrecta"
```bash
# La contraseña debe ser exactamente la que te dieron en CODE100
# Incluyendo mayúsculas, minúsculas, números y símbolos
```

### ❌ "CSC no configurado"
```bash
# Obtén tu CSC desde el portal de SIFEN:
# https://sifen.set.gov.py
```

## 📝 Notas Importantes

### 🔒 Seguridad
- **Nunca compartas** tu contraseña del certificado
- **Nunca compartas** tu CSC ni PIN
- Mantén los archivos `.env` fuera del control de versiones

### 📅 Renovación
- Los certificados tienen vigencia de 1 año
- El CSC debe renovarse periódicamente
- SIFEN notificará cuando sea necesario renovar

### 🧪 Ambientes
- **Pruebas**: `https://sifen-test.set.gov.py`
- **Producción**: `https://sifen.set.gov.py`

## 🎯 Próximos Pasos

Una vez configurado correctamente:

1. **Genera una factura de prueba**
2. **Valídala en el portal de SIFEN**
3. **Verifica que no haya errores de firma**
4. **Confirma que el código QR sea válido**

## 📞 Soporte

- **CODE100**: (021) 618-1000
- **SIFEN**: https://sifen.set.gov.py
- **SET**: Subsecretaría de Estado de Tributación

---

## ✅ Checklist de Verificación

- [ ] Archivo `.pfx` en `./certificates/`
- [ ] Contraseña correcta en `.env`
- [ ] CSC y PIN configurados
- [ ] Ambiente correcto (pruebas/producción)
- [ ] Certificado válido (no expirado)
- [ ] Prueba exitosa con `node test-certificado-real.js`

¡Tu sistema estará listo para emitir facturas electrónicas válidas! 🎉
