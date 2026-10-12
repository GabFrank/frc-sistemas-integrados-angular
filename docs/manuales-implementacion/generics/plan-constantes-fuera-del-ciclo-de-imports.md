# Plan: el desktop empaquetado queda en blanco al arrancar (constantes del genérico leídas antes de existir)

Repo: desktop. Sin cambios en central ni filial. Rama `fix/generics-constantes-antes-de-inicializar`, desde `develop`.

## 1. El problema [reproducido sobre `develop` `4d553dc8`, 2026-10-07]

El build de producción del desktop no arranca: la ventana queda en blanco y la consola dice

```
Uncaught ReferenceError: Cannot access 'mh' before initialization   (main.<hash>.js:1640)
```

`mh` es `TIMEOUT_CONSULTA_MOSTRADOR_MS`, de `src/app/generics/generic-crud.service.ts`. La lee, **al cargarse el
archivo**, `CONSULTA_BUSCADOR` de `operaciones/compra/gestion-compras/buscador-compras.service.ts`:

```ts
const CONSULTA_BUSCADOR: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_MOSTRADOR_MS, silenciarAvisoTimeout: true };
```

`generic-crud.service` está dentro de un ciclo de imports (importa `main.service`, que por varias vueltas termina
importando a los servicios que usan el genérico). En el bundle de producción webpack junta todo en un solo ámbito y
el orden queda: `buscador-compras.service` (línea 1640) … `main.service` … `generic-crud.service` (línea 16641). El
`const` del servicio de compras se evalúa 15.000 líneas antes de que la constante exista.

Con `ng serve` no se ve: los módulos no se concatenan y nadie carga el bundle de producción antes de publicarlo. El CI
compila (`npm run build:prod`) pero **no ejecuta** lo que compiló.

### Alcance medido

| Versión | Fecha | Arranque del AppImage con perfil limpio |
|---|---|---|
| v4.5.0 (stable, `master`) | 05/10 | arranca |
| alpha.125 | 03/10 | en blanco, mismo error con otra constante minificada (`nf`, sin identificar) |
| alpha.127, .155, .163 | 03/10 – 07/10 | en blanco, este error |
| `develop` `4d553dc8` (= alpha.164) compilado en local | 07/10 | en blanco, este error |

No se buscó el primer alpha roto. El patrón ya está en alpha.124 (6 archivos) y no existe en `release/beta` ni en
`master` (0 usos a nivel de módulo en las dos). Lo de alpha.125 es casi seguro la misma familia: en ese tag ya había
`TIMEOUT_CONSULTA_*` leídas a nivel de módulo. El AppImage y el instalador de Windows salen del mismo `dist/`.

### Cuántos lugares están expuestos

38 usos a nivel de módulo, en 36 archivos, de `TIMEOUT_CONSULTA_DE_FONDO_MS` / `TIMEOUT_CONSULTA_MOSTRADOR_MS`
importadas de `generic-crud.service` (relevados con el AST de TypeScript: todo lo que se evalúa fuera del cuerpo de
una función). Hoy revienta el primero que webpack ubica antes del genérico; cuál es depende del orden del bundle, que
cambia con cualquier import nuevo. Los demás usos de esas constantes (≈100 archivos) están dentro de métodos y corren
cuando todo ya cargó: no tienen el problema.

## 2. Cambio

### Fase 1 — las constantes salen del ciclo (fix)

1. **Archivo nuevo `src/app/generics/generic-crud.constantes.ts`**, sin imports de la app en tiempo de ejecución (solo
   `import type`). Recibe, tal cual están hoy: `QueryError`, `ContextoConsulta`, `TIMEOUT_CONSULTA_DE_FONDO_MS`,
   `TIMEOUT_CONSULTA_MOSTRADOR_MS`, `PROPAGAR_ERROR_DE_RED`, `LECTURA_ESTRICTA`, `CONTEXTO_MOSTRADOR`,
   `SIN_AVISO_DEL_GENERICO`.
2. **`generic-crud.service.ts`** deja de declararlas y las **re-exporta**, para que los ≈100 archivos que las usan
   dentro de métodos no cambien.
3. **Los 36 archivos que las leen al cargarse** pasan a importarlas **directo de `generic-crud.constantes`** (solo la
   línea de import; el resto del import de `generic-crud.service` queda igual).

Por qué el punto 3 y no solo el re-export: se probó. Con el re-export puesto como primera sentencia de
`generic-crud.service`, webpack igual emite el archivo de constantes después de `main.service` y el bundle falla en la
misma línea. Un archivo sin dependencias, importado directo por quien lo usa, se evalúa antes que ese archivo sin
depender del orden del resto.

4. **La regla queda escrita donde se lee**: comentario sobre el re-export de `generic-crud.service.ts`, encabezado del
   archivo nuevo y una entrada en `CLAUDE.md` (§GraphQL / Apollo): una constante del genérico que se lee al cargarse
   el archivo se importa de `generic-crud.constantes`, nunca del servicio.

No cambia ningún valor ni ningún comportamiento: mismas constantes, mismos tipos (comparado línea por línea contra
`develop`).

**Prueba de la fase** (el desktop no tiene batería en ningún gate; Karma no puede reproducir el defecto, que solo
existe en el bundle concatenado; lo que sí falla con el código viejo es el relevamiento AST y el humo):

- `npm run check` leído del log.
- Humo: `electron . --user-data-dir=<perfil nuevo> --enable-logging=stderr` (Electron 24.8.8) sobre el `dist/` compilado; 0 líneas
  `before initialization` y la app llega a la configuración inicial. **Rojo comprobado** con `develop` sin tocar y con
  la variante «solo re-export»; **verde comprobado** con el cambio completo (hecho como prueba de concepto en el
  análisis, sin commitear).
- Relevamiento AST: 0 usos a nivel de módulo de valores importados de `generic-crud.service` (antes 38).
- Prueba del usuario: AppImage empaquetado de la rama, abierto contra el alpha de esta máquina.

### Fase 2 — que no vuelva a pasar (a decidir)

Nada impide que mañana alguien escriba otro `const X = { timeoutMs: TIMEOUT_… }` importando del servicio, ni que otro
archivo del ciclo tenga el mismo defecto con otra constante (alpha.125 falló con una distinta). Opciones:

- **A. Arranque de humo en el CI** (recomendada): después de `npm run build:prod`, en el job de ubuntu, levantar
  Electron con `xvfb-run` sobre el `dist/` y fallar si la consola trae `before initialization` o si `app-root` queda
  vacío. Atrapa cualquier error de arranque del bundle, no solo este. Toca `.github/workflows/ci.yml` y suma un script.
- **B. Chequeo estático**: script con el AST de TypeScript que falla si un archivo lee a nivel de módulo un valor
  importado de `generic-crud.service`. Barato y determinista, pero solo cubre este servicio.
- **C. Nada automático**: dejar la regla escrita en `CLAUDE.md` y en el comentario del archivo.

Las dos auditorías coinciden en A como red general y B como complemento barato (B, ampliado a «cualquier valor
importado dentro del ciclo», es además la única prueba que falla con el código viejo sin levantar Electron). Ninguna
cubre Windows ni un error que solo aparezca en una pantalla que no se abre al arrancar.

La fase 2 va en un PR aparte (toca la maquinaria de CI) y no bloquea la fase 1.

## 3. Datos nuevos

`N/A`: no nace ningún campo, columna ni clave. Se mueven de archivo ocho símbolos que ya existen.

## 4. Lo que el plan no toca

- El ciclo de imports en sí (`generic-crud.service` ↔ `main.service` ↔ …): sigue existiendo (244 archivos).
- `componenteList` de `shared/widgets/search-bar-dialog/search-bar.service.ts`: lee 18 clases de componente del
  ciclo al cargarse. Es el mismo mecanismo; hoy el orden lo tolera (está igual en `master` y la 4.5.0 arranca). Queda
  expuesto: solo el humo de la fase 2 lo cubriría.
- Los ≈100 archivos que usan las constantes dentro de métodos.
- Central, filial, mobile-pwa: no comparten este código.

## 5. Sin verificar

- El instalador de Windows (mismo `dist/`; lo compila el CI en `windows-latest`, pero tampoco lo arranca).
- El desktop servido como web (`web-production`): no se cargó ese bundle; el defecto es del mismo código, así que es
  probable que lo tenga y que el cambio lo cubra.
- Si después de este error hay otro de arranque que solo aparece empaquetado (impresión, IPC): el humo llega hasta la
  pantalla de configuración inicial, sin sesión.
- PR #444 (borrador, `fix/oncustomquery-siempre-termina`) y #446 (apilado sobre #444) tocan `generic-crud.service.ts`
  y varios de los 36 archivos: el que se mergee segundo va a tener conflictos de import. #444 agrega
  `CONTEXTO_SONDEO` al servicio; hoy se usa solo dentro de métodos, pero al resolver el conflicto tiene que quedar en
  `generic-crud.constantes.ts` con las demás.
- Qué constante era `nf` en alpha.125.

## 6. Despliegue

Un PR a `develop`. Al mergear sale un alpha nuevo. **Cada PR que entre a `develop` antes que este publica otro alpha
en blanco.**

Cómo se recupera una instalación alpha en blanco: el chequeo, la descarga y el diálogo «Cerrar y actualizar» los hace
el proceso principal (`app/main.ts`, `dialog.showMessageBox`), que sí corre. Aparece solo si
`config/config-backup.json` tiene `updateChannel` en `alpha`; hay que elegir «Cerrar y actualizar» (con «Más tarde» no
se instala al cerrar: `autoInstallOnAppQuit = false`). Una instalación sin canal guardado no se actualiza sola: se
reinstala a mano. Leído del código, no probado en una máquina con el alpha roto.

`release/beta` y `master` no tienen el patrón: les llegaría con la próxima promoción de `develop`, que tiene que
incluir este fix. El desktop web del canal alpha (`Deploy Web`, config `web-production`) compila el mismo código: si
se publicó desde `develop` después del 03/10 puede estar en blanco, y hay que republicarlo después del merge.
