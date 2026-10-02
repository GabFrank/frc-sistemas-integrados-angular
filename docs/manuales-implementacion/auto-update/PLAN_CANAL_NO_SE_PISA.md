# Plan — el renderer deja de pisar el canal de actualización al arrancar

Issue: #384. Rama: `fix/configuracion-canal-no-se-pisa` (desde `develop`, con #383 mergeado).

## Qué pasa

El canal (`updateChannel`: `alpha | beta | stable | dev | null`) vive en dos lados:

- **main** lo lee de `<userData>/config/config-backup.json` al arrancar (`configureUpdateChannel`)
  y con eso configura el updater. `null` o `dev` = auto-update apagado.
- **renderer** (`ConfiguracionService`, único servicio en uso; `config.service.ts` está deprecado
  y no manda IPC) tiene su copia en `localStorage` y la **impone** al main.

Observado el 01/10 (Linux) y el 02/10 (Windows): main arranca en `alpha` y a los 2 s el renderer
manda `stable` y reescribe el archivo.

## Caminos que escriben el canal (mapeo completo, `configuracion.service.ts`)

| Camino | Línea | Disparador | Efecto hoy |
|---|---|---|---|
| constructor → `ensureConfigSynced` → `syncConfigToMainProcess` | 114-125, 466-474 | **automático**, si hay config en `localStorage` | `save-config-backup` con el JSON de `localStorage` (pisa el archivo) + `set-update-channel` con su canal, sin mirar el archivo |
| constructor sin `localStorage` → backup / legacy / `configuracion-local.json` / DEFAULT | 142-174, 670 | **automático** | backup: solo `localStorage`; los demás → `saveConfig` con canal `null` |
| `isConfigured()` sin `localStorage` | 535-552 | **automático** (`app.component.ts:159`) | puede caer a `saveConfig` |
| `getConfig()` lazy sin config | 759-775 | **automático** | `saveConfig(DEFAULT)` → canal `null` |
| `saveConfig` | 600-633 | todos los anteriores + usuario | `saveToBackupFile` (**escribe el archivo con `fs`**, 354-457) + `save-config-backup` + `set-update-channel` con **`updateChannel \|\| 'stable'`** (629) |
| `updateConfig` (header IP, `main.service`, login, impresora) | 808-811 | usuario, pero **no** elige canal | reenvía el canal de `this.config`; si es `null` → `stable` |
| `update-dialog` `onChannelChange` / diálogo de configuración | `update-dialog:70`, `configuracion-dialog:159` | **elección explícita** del canal | el canal elegido (el form lo exige: `Validators.required`) |

Hay **dos escritores** del archivo: el IPC `save-config-backup` (main) y `saveToBackupFile`
(renderer, `fs` directo). Proteger solo uno no alcanza.

## Diseño

**Fuente de verdad del canal: `config-backup.json`, que es lo que usa el main.** El renderer lo
**adopta** al arrancar y solo lo cambia una elección explícita. Así toda escritura posterior
(IPC o `fs`) lleva el canal correcto.

### main (`app/main.ts` + `main.js` regenerado)

1. `leerCanalGuardado()`: lee `updateChannel` del `config-backup.json` principal (o `null`). Un
   archivo ilegible o con JSON roto devuelve `null`, nunca lanza.
2. `ipcMain.on('get-update-channel')`: síncrono, devuelve `leerCanalGuardado()`. Lee el archivo,
   no una variable, así no depende de que `configureUpdateChannel` haya corrido (en dev no corre).
   **Siempre responde** (`try/finally` que fija `event.returnValue`): un `sendSync` sin respuesta
   congela el renderer (auditoría B, alto). Se registra a nivel de módulo, junto a
   `save-config-backup` (`main.ts:440`), mucho antes de `createWindow`.
   - Si `configureUpdateChannel` armó el archivo principal **copiándolo desde una ruta de
     fallback** (`main.ts:112-133`), devuelve `null` y el renderer conserva su `localStorage`, como
     hoy. Lo decidió Franco el 2026-10-02 (opción B de «Contradicción»).
3. `save-config-backup`: si el JSON entrante trae `updateChannel` vacío y el archivo tiene uno, se
   **conserva** el del archivo. Es una defensa: con el punto 4 ya no debería llegar vacío.

### renderer (`configuracion.service.ts`)

4. `canalDelMainAlArrancar`: se consulta **una sola vez**, al principio del constructor
   (`ipcRenderer.sendSync('get-update-channel')` en `try/catch`; fuera de Electron, como en modo
   web, → `null`). Así no hay un `readFileSync` + `sendSync` bloqueante por cada guardado
   (auditorías A y B).
5. **Adopción al arrancar**, sobre el resultado **final** de cada rama:
   - en `ensureConfigSynced`, antes de `syncConfigToMainProcess`: si main tiene canal y difiere del
     de `localStorage`, gana el de main. Se actualiza `localStorage` y se loguea el cambio;
   - igual en la rama «backup» de `loadConfigFromBackupSources`, que primero lee la clave
     `config_backup` de `localStorage` y recién después el archivo: se adopta sobre lo que haya
     salido de ahí (auditoría A).
6. `validateConfigObject`: `updateChannel: config.updateChannel || canalDelMainAlArrancar ||
   DEFAULT`. Cubre los caminos automáticos que arman la config desde cero (legacy,
   `configuracion-local.json`, DEFAULT, `getConfig` lazy): ya no salen con `null`. Una elección del
   usuario nunca llega vacía (los tres selectores solo ofrecen alpha/beta/stable/dev y el form la
   exige), así que no la pisa.
7. `saveConfig:629`: **el `|| 'stable'` se mantiene**. Con 5 y 6, el renderer solo llega sin
   canal si el archivo **tampoco** tiene, y ahí el `stable` de sesión es el comportamiento de hoy.
   Sacarlo dejaría sin updates a cajas viejas, ya configuradas pero sin canal en el archivo, en
   bodega o farmacia (auditoría A, medio). Lo que pisaba un canal real era imponer la copia del
   renderer, no este default.

No se toca: el `|| 'stable'` de `configuracion-dialog.component.ts:194`, que está detrás de un
`Validators.required`, ni `saveToBackupFile` (con 5 y 6 escribe el canal correcto).

**Sin cambio de comportamiento** para instalaciones nuevas ni para cajas sin canal: siguen igual
que hoy.

### Contradicción entre auditores — arbitrada: **B** (Franco, 2026-10-02)

**El caso:** una caja sin archivo principal. `configureUpdateChannel` copia el de una ruta de
fallback (`userData/config-backup.json` o `appData/frc-sistemas/config-backup.json`) y arranca con
ese canal.

| | Propuesta | Riesgo |
|---|---|---|
| **A** | Adoptarlo: es el canal que main está usando | si la copia es vieja, pisa la elección que el usuario tiene en `localStorage` |
| **B** | No adoptarlo (`get-update-channel` → `null`): el renderer impone su `localStorage`, como hoy | si `localStorage` es el viejo, se repite el bug de #384 en ese caso puntual |

Recomendación: **B**. Es el comportamiento de hoy para un caso raro (cajas muy viejas o donde
`@electron/remote` falló al escribir). El fallback es una copia de edad desconocida, y
`localStorage` refleja la última elección hecha en esa instalación.

### Riesgos residuales (documentados, no se arreglan acá)

- **Cajas ya pisadas** (auditoría B, alto): las que el bug dejó con `config-backup.json` en
  `stable` cuando el usuario quería alpha/beta **quedan en stable**. El arreglo consolida lo que
  diga el archivo y no puede saber qué se quería. Se detectan en `main.log`: `Update channel from
  config: alpha` seguido de `Update channel changed to: stable` sin que el usuario lo haya
  elegido. Se arreglan **reeligiendo el canal en la UI**. Esas cajas reciben este arreglo recién
  cuando llegue a stable.
- **Segunda ventana** (`createWindow(SECOND_INSTANCE_PARTITION)`, `main.ts:285/312`, con su propio
  `localStorage`): si se cambia el canal en una ventana, la otra conserva el viejo en memoria y lo
  reenvía en su próximo `saveConfig` (cambio de IP, login). **Ya pasa hoy** y requiere cambiar el
  canal con las dos ventanas abiertas. Queda para otra issue.

**Tipo de commit: `fix(configuracion):`**. Genera alpha.

## Datos nuevos

| Dato | Escribe | Lee |
|---|---|---|
| IPC `get-update-channel` | main (`leerCanalGuardado`, desde el archivo) | renderer: `canalGuardadoEnMain` (adopción en 5 y relleno en 6) |

No nace ningún campo ni clave de config: `updateChannel` ya existía en los dos lados.

## Tests

N/A batería: el CI del desktop no corre tests [ev: `.github/workflows/ci.yml`]. En su lugar, un
AppImage local con `XDG_CONFIG_HOME`/`XDG_CACHE_HOME` aislados (misma técnica que en #383):

| Caso | Preparación | Esperado con el fix | Con el código viejo |
|---|---|---|---|
| T1 config nueva | archivo `{"updateChannel":"alpha"}`, sin `localStorage` | se queda en `alpha`, sin ningún `changed to: stable`; el archivo sigue en alpha | pasa a `stable` (ya observado) |
| T2 `localStorage` viejo | correr con el archivo en `stable` (queda en `localStorage`), cerrar, poner el archivo en `alpha`, volver a abrir | adopta `alpha`; el archivo sigue en alpha | manda `stable` y pisa el archivo (el caso de Windows) |
| T3 sin archivo, sin `localStorage` | nada | igual que hoy: `stable` de sesión, archivo sin canal | `stable` de sesión |
| T4 `dev` con `localStorage` en alpha | archivo `dev`, `localStorage` de una corrida previa en alpha | sigue en `dev`, sin updates | pasa a alpha |
| T5 archivo sin canal, `localStorage` con canal (instalaciones viejas) | archivo sin `updateChannel`, `localStorage` en `beta` | el renderer manda `beta` y el archivo queda en beta | igual |
| T6 archivo corrupto, `localStorage` con canal | archivo con JSON roto | la ventana carga (no se congela); el archivo se repara con el canal de `localStorage` | igual |
| T7 fallback | sin archivo principal, `appData/frc-sistemas/config-backup.json` en `stable`, `localStorage` en `alpha` | queda en `alpha` (opción B) | `alpha` |

- T1 se corre **también con el AppImage viejo**, el de la rama de #383, para que el test falle con
  el código anterior.
- `npm run build:prod` leído del log.
- **Elección explícita (UI):** cambiar el canal desde el diálogo y reiniciar → persiste. No se
  puede automatizar sin manejar la UI. Lo prueba Franco en la PC Windows, con un portable de esta
  rama, que es además el caso real de la issue.

## Qué queda sin verificar y cómo

- Por qué en Windows el portable no vio el `localStorage` del instalado (los dos cargan
  `file://` sobre la misma `userData`). Con este diseño da igual: gana el archivo.
- Windows: con el portable, como en #383.

## Si sale mal

- Síntoma posible: el canal no cambia desde la UI (si el punto 6 pisara una elección), o un
  desktop sin canal. Se ve en `main.log` (`Update channel changed to:` / `Update channel from
  config:`).
- Revertir con un PR `fix` → alpha. El diseño no borra datos: en el peor caso el usuario vuelve a
  elegir el canal en la UI.
