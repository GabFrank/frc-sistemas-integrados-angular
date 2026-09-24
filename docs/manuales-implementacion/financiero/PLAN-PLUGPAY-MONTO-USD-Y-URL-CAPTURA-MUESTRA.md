# Plan — Monto en dólares del cupón y URL de la captura de muestra

**Aprobado por Gabriel el 2026-09-24**, después de la auditoría del paso 5 (ejes A y B).

Rama: `fix/venta-tarjeta-monto-decimal-ocr` (desde `develop` @ `a4597cf7`, 2026-09-24). Un solo PR a
`develop` del desktop. **Solo desktop**: ni central ni filial cambian (ver «Piezas»).

## Por qué

Al cargar el formato del proveedor **PLUG PAY** (tickets de FARMACIA FRANCO SUC1, 2026-09-24)
aparecieron dos defectos del desktop que impiden usarlo en farmacia:

1. **El monto en dólares se guarda multiplicado por 100.** PlugPay imprime `USD 146.50`. El OCR lo
   lee bien (4 de 4 fotos, medido con `RunnerFormatoCuponTest` del central), el formulario de
   confirmación lo muestra bien, y `aNumero()` de `carga-manual-cupon-dialog.component.ts` quita
   **todos** los puntos: se guarda `14650`. Lo cobrado (`data.monto`, un número) pasa por la misma
   función para la comparación, y `146.5` se volvía `1465`. Desde el formato no tiene arreglo:
   el patrón solo recorta el texto, y con `escala` el valor llega como número y sale `1465`
   (medido corriendo la función real con node).
2. **«El mapa del cupón» y «Probar» no funcionan ni en la web ni en la app instalada.**
   `MapaFormatoService.urlCentral()` arma la URL del QR, la de «Subir una foto» / «Probar con una
   foto» y la de la vista previa de la muestra con `window.environment.centralIp` o
   `location.hostname`, y puerto `8081` fijo. **`window.environment` no lo llena nadie**: el
   `config.service.ts` que lo escribía no se inyecta en ningún lado (solo se importa su tipo
   `AppConfig`) y ni `main.ts` ni `preload.ts` lo tocan —auditoría eje A, verificado por grep—.
   Así que siempre cae al hostname de la página. Medido el 2026-09-24:
   - app instalada: `http://:8081/public/captura-muestra/…` — en Electron el hostname es `''` y
     `??` no lo reemplaza; y `:8081` es el central de **bodega**, que da **404** en esa ruta.
   - web: `http://farmacia.desk.frcsuite.com:8081/…` — el host de Pages, sin backend: no responde.
   - el central de farmacia **sí** la sirve: `https://farmacia-api.frcsuite.com/public/captura-muestra/x`
     y `http://159.203.86.103:8082/…` → `410` (token inventado: correcto). El preflight CORS desde
     `https://farmacia.desk.frcsuite.com` devuelve `Access-Control-Allow-Origin` con ese origen.

## Piezas

| Pieza | Cambia | Por qué / evidencia |
|---|---|---|
| desktop | sí | los dos defectos están en el desktop |
| central | **no** | la captura de muestra ya está en farmacia (`v4.8.0-beta.5` contiene `feature/ocr-cupon-fase2`; responde 410). `frc.captura-muestra.base-url` existe pero **solo corregiría el QR**, no las subidas ni la vista previa |
| filial | **no** | filial 1 farmacia en `v5.0.0-beta.3` (deployment del 2026-09-23, *Health check passed*), contiene la fase 2; `/public/captura/…` responde 410. La URL de la captura del **cobro** la arma el filial (`qr.url`), no `urlCentral()`: no está afectada |
| mobile-pwa / mobile | **no** | no usan ninguno de los dos métodos (grep cruzado de `captura-muestra` en los 6 repos) |
| **bodega (stable)** | **no, y sigue sin funcionar** | la captura de muestra entera —GraphQL y rutas REST— **no está en `master` del central** (`3f9e4584` no es ancestro de `origin/master`; `https://bodega-api.frcsuite.com/public/captura-muestra/x` → 404). Preexistente, fuera de este PR. Después de la fase 2, en bodega la URL va a salir **bien armada** hacia `bodega-api` y va a dar 404 hasta que la fase 2 del OCR se promueva a stable (auditoría eje A) |

## Fases

### Fase 1 — `aNumero` acepta el punto decimal (ya implementada, sin commitear)

Regla, de lo más seguro a lo menos:
- número → tal cual (arregla lo cobrado y el caso `escala`);
- punto **y** coma → el último es el decimal (`1.500,50`, `1,146.50`);
- solo coma → una es decimal (`146,50`, como siempre); varias son miles;
- solo puntos → punto final + 1 o 2 dígitos es decimal (`146.50`); si no, miles (`918.957`).

Tests: `a-numero.spec.ts` (23 expectativas). Karma está roto en todo el desktop, así que se
ejecutaron **los mismos casos contra la función real extraída del archivo, con node**: 23/23.
Contra la versión de `develop` fallan 4 bloques —dólares (`146.50` → 14650), `escala` (146.5 →
1465), importe en inglés (`1,146.50` → 1.1465) y guaraníes con `.00` (918957.00 → 91895700)— y
pasan los de guaraníes que no tenían que cambiar: el test prueba lo que dice.

### Fase 2 — `urlCentral()` usa la configuración con la que Apollo habla con central

- Leer `serverCentralIp` / `serverCentralPort` de `ConfiguracionService.getConfig()` —la misma
  fuente que `graphql-connection.service.ts`, que en la web ya aplica `aplicarOverrideWeb`
  (`farmacia.desk` → `farmacia-api.frcsuite.com`)— y armar con `urlsDeServidor()`, igual que
  `notification-http.service.ts` y `ente-documento.service.ts`.
  - web publicada → `https://farmacia-api.frcsuite.com/public/captura-muestra/<token>`
  - app instalada → `http://<serverCentralIp>:<serverCentralPort>/…`
- Fallback sin configuración (solo `ng serve` de desarrollo): `location.hostname` si no está vacío,
  y puerto `8081`. Con `||`, no `??`, para que el `''` de Electron no pase.
- Consumidores que heredan el arreglo sin cambiar: `mapa-formato-panel` (QR y «Subir una foto»),
  `probar-formato-panel` (QR y «Probar con una foto») y `vista-previa-formato` (miniaturas y foto
  grande de la muestra, `onGetImagenMuestra`, líneas 298 y 312).
- No se toca `qrEsAlcanzable()`: sigue avisando si la URL queda en `localhost`.
- Si el servidor devuelve `url` propia (`frc.captura-muestra.base-url`), el QR la sigue usando
  (sin cambio en `mapa-formato-panel` / `probar-formato-panel`).

Tests: `mapa-formato.service.spec.ts` con `ConfiguracionService` simulado — IP y puerto
configurados, configuración vacía, hostname vacío. El caso HTTPS depende de `location.protocol`
y se verifica en la prueba de runtime (abajo), no en el spec.

### Fase 3 — Documentación y cierre (paso 11)

- `docs/manuales-implementacion/financiero/VENTA-TARJETA-QR-CUPON.md`: la regla de `aNumero` y de
  dónde sale la URL de la captura de muestra.
- Este plan se borra en el último commit del PR (paso 11: el plan muere al cierre).
- Skill `frc-pos-expert` (repo `frc-cicd`, otro repo): el formato PLUG PAY como segundo ejemplo
  medido, la trampa del EXIF (el runner lee los píxeles crudos; la página del teléfono aplica la
  orientación) y que cada corrida del runner borra `target/`. Y corregir la regla crítica 2: dice
  que `completar()` valida el monto con `toleranciaDiferenciaMontoPct`, y el filial **no lee ese
  campo en ningún servicio** (grep: 0 usos en `VentaTarjetaService`; solo existe en la entidad) —
  auditoría eje B, hallazgo 3, verificado. **Va en un PR de `frc-cicd`** porque
  es otro repo; no despliega nada.

## Datos nuevos

N/A: ninguna columna, campo, clave de configuración ni valor de enum nuevo. Los dos cambios son
de lectura/conversión en el cliente.

## Prueba de runtime (paso 9)

Antes: traer `develop` a la rama (la rama sale de `develop` de hoy; se re-verifica con
`git rev-list --count HEAD..origin/develop`).

En **local** (nunca contra farmacia): central y filial con `spring-boot:run -Dspring-boot.run.profiles=dev`
(los corre Gabriel en su terminal), desktop con `ng serve -c web` + Claude in Chrome:
1. ABM formato → «El mapa del cupón»: el QR y la URL mostrada apuntan a `http://<ip-central>:<puerto-central>`.
2. «Subir una foto» con `cupones-prueba/plugpay-normalizada/*.jpg` → la muestra aparece y se ve la
   vista previa.
3. «Probar con una foto» con el formato PLUG PAY → campos `identificadorTransaccion`, `monto`
   `146.50`, `fecha`.
4. Carga manual / confirmación con monto `146.50` → lo guardado (base del filial, 5552) es `146.5`.

## Qué queda sin verificar

- **El caso HTTPS en la web publicada** no se puede reproducir en local (`ng serve` es HTTP). Se
  cubre por construcción —es `urlsDeServidor()`, el mismo helper con el que la web publicada ya
  habla GraphQL con `farmacia-api`— y se verifica en `farmacia.desk` cuando se promueva.
- ~~Qué `serverCentralIp` tienen configurado las cajas de farmacia~~ — **resuelto 2026-09-24**:
  Gabriel confirma que usan la IP pública `159.203.86.103` para central (e IP local para el
  filial). La URL queda `http://159.203.86.103:8082/public/captura-muestra/…`, y esa dirección
  responde desde fuera de la red (medido: 410 con token inventado), así que el teléfono la alcanza.
  Si alguna caja tuviera una IP de VPN, la salida sin código es `frc.captura-muestra.base-url`.
- Karma: los specs se escriben y no se ejecutan en su runner (hueco conocido del repo).
- ~~Si ya hay cupones PLUG PAY guardados en farmacia~~ — **resuelto 2026-09-24**: Gabriel
  confirma que el formato no está asignado a ninguna terminal, así que no hay cobros completados
  con él ni montos guardados ×100 (auditoría eje B, hallazgo 2).
- **Qué otros formatos están activos en farmacia y si alguno produce `.00`** en guaraníes. Si lo
  hay, hoy se guarda ×100 y el fix lo corrige de acá en adelante (los guardados no cambian).
  INFONET no: su grupo `monto` es `[0-9][0-9.]*` sin `escala`. Se releva con Gabriel (eje B).

## Pasos del ciclo cumplidos fuera de orden (registro)

- La Fase 1 se implementó **antes** de escribir y auditar este plan (pasos 4–6 salteados). Se
  compensó con una revisión independiente del diff de `aNumero` (sin regresiones en guaraníes;
  sus casos se sumaron al spec) y queda sujeta a la auditoría del paso 5 y del paso 8.
- `npm run check` se corrió sobre la Fase 1 (exit 0) antes del plan. Se vuelve a correr al final
  de todas las fases.

## Despliegue

- Merge a `develop` → release alpha del desktop (canal alpha, `alpha.desk`). **Farmacia lo recibe
  recién cuando se promueva a `release/beta`**: desktop canal beta + `farmacia.desk`. Aviso de
  reinicio: los usuarios ven «Cerrar y actualizar» en ≤5 min.
- Sin migraciones, sin cambio de backend, sin orden de despliegue entre repos.
- **Paso operativo, no de código: el formato PLUG PAY se asigna a una terminal recién cuando las
  cajas que la usan tengan el desktop nuevo** (canal beta, versión verificada). Una caja con el
  desktop viejo guardaría `USD 146.50` como 14650. El control de duplicados de PLUG PAY no se
  afecta por la convivencia de versiones: va por `identificadorTransaccion` (comparación exacta de
  la referencia, sin mirar el monto); el control por `codigoAutorizacion` + monto, que sí compara
  montos, no corre porque PLUG PAY no imprime código de autorización —`motivoPorCodigoAutorizacion`
  sale en la primera línea con `codigoAutorizacion` nulo— (auditoría eje B, hallazgo 1, verificado).
- Rollback: revertir el PR; no hay estado que deshacer. Un cupón guardado con el `aNumero` viejo
  (14650) no se corrige solo — hoy no hay ninguno: PLUG PAY no está asignado a ninguna terminal
  (confirmado por Gabriel el 2026-09-24).
