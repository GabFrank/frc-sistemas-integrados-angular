# Plan: el CI ejecuta el bundle que compila (guarda del arranque en blanco)

Repo: desktop. Rama `chore/ci-verificar-arranque-del-bundle`, desde `develop` (`b9df727a`, ya con el #447). Es la
fase 2 de `plan-constantes-fuera-del-ciclo-de-imports.md`, en PR aparte porque toca el CI.

## 1. El problema

El CI de PR corre `npm run build:prod` y `npm run electron:serve-tsc`: compila el bundle y no lo abre. Un error que
solo existe al evaluar el bundle concatenado deja la ventana en blanco con los dos checks en verde. Así se publicaron
los alphas .125 a .164 (03/10 – 07/10/2026): `Cannot access '…' before initialization`.

El #447 (mergeado el 07/10, alpha.165) arregló los 36 archivos que lo provocaban. No impide que vuelva: alguien puede escribir otro
`const X = { timeoutMs: TIMEOUT_… }` importando del servicio, y hay al menos otra lectura del mismo tipo que hoy
funciona por el orden del bundle (`componenteList` en `search-bar.service.ts`).

## 2. Cambio

### Fase 1 — dos verificaciones y sus pasos en `ci.yml`

1. **`scripts/verificar-imports-del-generico.js`** → `npm run verificar:imports`. Chequeo estático con el AST de
   TypeScript (ya es dependencia): falla si un archivo de `src/` lee, al cargarse, un valor importado de
   `generic-crud.service`, o si `generic-crud.constantes.ts` importa algo en tiempo de ejecución. Segundos, sin
   compilar. Corre en los dos sistemas, antes del build.
2. **`scripts/verificar-arranque.js`** → `npm run verificar:arranque`. Abre `dist/` en Electron con Playwright
   (`_electron`, ya es dependencia de `e2e/`) sobre un perfil nuevo y falla si `app-root` queda vacío a los 30 s o si
   aparece un error `before initialization`. Otros errores de consola se listan y no bloquean. No necesita backend
   y usa un home temporal: no lee la config guardada de quien lo corre. Sale con 1 si el bundle no arranca y con 2
   si no pudo hacer la prueba. Corre solo en ubuntu, bajo `xvfb-run -a`, después del build, con tope de 5 minutos.
3. **`CLAUDE.md`**: los dos scripts en Build & Run, lo que corre el CI y el preflight de la resolución automática.

No cambia código de la app, ni `release.yml`, ni el empaquetado.

**Prueba de la fase**, en los dos sentidos, todo en local:

| | bundle roto | bundle sano |
|---|---|---|
| `verificar:imports` | rojo sobre `develop` antes del #447 (38 lecturas) y con el defecto repuesto en un archivo (1 lectura) | verde sobre `develop` `b9df727a` |
| `verificar:arranque` | rojo sobre el bundle publicado de alpha.164: «no dibujó nada en 30 s» + `Cannot access 'mh' before initialization` | verde sobre el build de `develop` `b9df727a`, sin procesos ni temporales colgados |

Dato que salió de la prueba: reponer el defecto en **un solo** archivo (`buscador-compras.service.ts`) hace fallar el
chequeo estático pero el bundle **arranca igual**, porque con los otros 35 archivos corregidos el servicio queda
evaluado antes. El estático marca el riesgo aunque el orden de hoy lo tolere; el arranque solo falla cuando el bundle
de verdad no abre. Son complementarios, no redundantes.

El #447 ya está en `develop`, así que el CI de este PR tiene que dar **verde**: lo que se va a ver ahí por primera vez
es si Electron levanta en el runner.

## 3. Datos nuevos

`N/A`: no nace ningún campo, columna ni clave. Dos scripts npm nuevos, que corre el CI.

## 4. Lo que el plan no cubre

- **Windows**: el arranque corre solo en ubuntu. El bundle es el mismo; un defecto propio de Windows no se ve.
- **`release.yml`**: el release no corre la guarda. En la práctica todo lo que entra a `develop` pasó por el CI de
  su PR (los últimos 30 commits de primer padre son merges de PR).
- **`release/beta` y `master`**: su `ci.yml` no tiene los pasos hasta la próxima promoción. Un `hotfix/*` contra
  `master` no corre la guarda mientras tanto; el PR de promoción desde `develop` sí.
- **Pantallas que no se abren al arrancar** y módulos de carga diferida: el humo llega a la primera pantalla.
- **El build web** (`web-production`): no se abre.
- El chequeo estático mira solo `generic-crud.service` y solo imports relativos. No ve una función definida en el
  archivo e invocada a nivel de módulo (`const X = f()`), ni `@Inject(VALOR)` en un constructor. Extenderlo a
  «cualquier valor leído dentro del ciclo» hoy marcaría `componenteList`, que funciona: queda para cuando se decida
  qué hacer con esa lista.
- Un error posterior al primer dibujo (una ruta, un módulo de carga diferida) no bloquea: se lista y nada más.

## 5. Sin verificar

- Que Electron levante en el runner de GitHub bajo `xvfb-run` con `--no-sandbox`: en esta máquina no hay xvfb. Tampoco
  que `xvfb-run` venga instalado en `ubuntu-latest`, ni que el `postinstall` (`electron-builder install-app-deps`)
  deje completo `app/node_modules`, del que depende `app/main.js`. Las tres cosas se ven en el CI de este PR.
- El chequeo estático en `windows-latest` (usa `path` de la plataforma; no se corrió ahí).
- Cuánto suma al job de ubuntu (en local, ~10 s el arranque).
- Estabilidad: si el paso resultara intermitente en el runner, bloquea los PRs de todo el equipo. Antes de mergear:
  re-ejecutar el job 3 a 5 veces sobre este PR y mirar que dé siempre verde y cuánto tarda. Para apagarlo después hace
  falta un PR que quite el paso (su propio CI ya corre sin él) y alguien que lo mergee. No se puso
  `continue-on-error`: un check que no bloquea es una guarda que nadie mira.

## 5 bis. Auditoría del plan (2 ejes)

Sin bloqueos. Aplicado: home temporal para no leer la config de quien lo corre; sondeo por intervalo y no por cuadro
(sin gestor de ventanas la página puede no pintar); la salida de Electron se junta entera antes de buscar errores;
que la ventana no aparezca cuenta como «no dibujó» y no como fallo de la prueba; se termina el grupo de procesos antes
de borrar el perfil; tope de tiempo en el paso; `extends` se revisa y `import { type A }` no cuenta como import de
ejecución; `CLAUDE.md` actualizado. Descartado: apagar el updater para la prueba (sin empaquetar, `app/main.js` no lo
consulta: `if (!isDev)`).

## 6. Despliegue

Un PR a `develop`. Commits `ci`/`docs`: no generan release ni alpha. Desde el merge, todo PR contra `develop` corre las
dos verificaciones en su próximo push (hoy: el #444).
