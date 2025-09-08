CERTIFICADOS DIGITALES SIFEN

En esta carpeta debes colocar tu certificado digital (.pfx) para la firma de DTEs.

INSTRUCCIONES:
1. Coloca tu archivo .pfx en esta carpeta
2. Actualiza la configuración en src/config/config.js:

   - certificates.path: './certificates/tu-archivo.pfx'
   - certificates.password: 'tu-contraseña'

IMPORTANTE:
- El certificado debe estar vigente
- La contraseña debe ser correcta
- El archivo debe tener permisos de lectura

EJEMPLO:
Si tu archivo se llama "mi-certificado.pfx":
- Colócalo aquí: ./certificates/mi-certificado.pfx
- En config.js: certificates.path: './certificates/mi-certificado.pfx'
