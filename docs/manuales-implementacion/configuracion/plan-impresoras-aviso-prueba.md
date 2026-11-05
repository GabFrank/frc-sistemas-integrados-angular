# Plan: el aviso de «Probar» impresora nombra a la impresora, no solo a la sucursal

Rama `fix/impresoras-aviso-prueba` del desktop, desde `develop` (78b604b9). Pieza única: desktop. Sigue a filial#234
(issue filial#213).

## Qué pasa

Configuración → Impresoras → «Probar», cuando sale por el servidor (`ListImpresorasComponent.probarPorBackend`, el
camino del navegador y el respaldo de Electron), avisa ante un `false`:

> No se pudo imprimir en <impresora>: verificá que la sucursal esté online y la cola exista

Desde filial#234 (y desde central#544 para las impresoras del central) ese `false` llega también cuando la cola existe
pero rechaza trabajos, o cuando la impresora de red no responde. El texto manda a revisar la sucursal y la cola, y no
nombra el caso más común: la impresora apagada o pausada.

## Fase 1 — texto

`list-impresoras.component.ts:284`: el detalle pasa a

> revisá que la sucursal esté online y que la impresora exista, esté encendida y acepte trabajos

Un solo literal. No cambia la lógica, ni las llamadas, ni el aviso de éxito o el de error de red.

## Datos nuevos

Ninguno.

## Tests

N/A para el desktop: el CI no corre Karma y el texto no tiene spec. Gates, los mismos que el CI: `npm run
verificar:imports`, `npm run build:prod`, `npm run electron:serve-tsc` y `npm run verificar:arranque` (con `DISPLAY=:0`).

## Prueba de runtime

Desktop web en `127.0.0.1:4200` contra un central y un filial locales, impresoras de la sucursal 24 con colas CUPS
propias `zz_`:

1. cola que rechaza → «No se pudo imprimir en …: revisá que la sucursal esté online y que la impresora exista, esté
   encendida y acepte trabajos»;
2. cola que acepta → «Ticket de prueba enviado a …»;
3. filial apagado → el central ataja la caída del reenvío y devuelve `false` (`PrintRouterService.proxyImprimir`):
   el mismo texto del caso 1, no el aviso de error de red.

Al final: `lpadmin -x` de las colas `zz_` y `DELETE` de las filas de prueba en `bodega` y `general`.

## Compatibilidad

- Desktop nuevo con un filial o un central viejos (que todavía dicen `true` aunque la cola rechace): ve el texto nuevo
  solo en los casos que ya daban `false` (sucursal caída, cola inexistente), y el texto los cubre.
- Desktop viejo (el update es opcional) con backend nuevo: sigue diciendo «la cola exista» cuando la cola rechaza.
  Impreciso, sin efecto en datos.

## Auditoría del plan (paso 5)

| Hallazgo | Eje | Qué se hizo |
|---|---|---|
| El texto cubre impresora no encontrada, filial caída, cola inexistente o que rechaza y red sin respuesta. Token rechazado entre central y filial y sucursal sin IP quedan bajo «sucursal online»: aproximado, no engañoso | A | Aceptado: son casos de configuración que no se arreglan desde esta pantalla |
| `probarEnBackend` tiene un solo llamador; `imprimir-en-sucursal-dialog` ya avisa «No se pudo confirmar la impresión…», que nombra la impresora | A | Nada más que cambiar |
| Con un filial o central viejos, una cola que rechaza sigue dando «enviado»: lo arregla el backend (filial#234), no el texto | A | Fuera de alcance |
| Faltaban los gates del CI (`verificar:imports`, `build:prod`, `electron:serve-tsc`, `verificar:arranque`) | B | Agregados |
| Desktop viejo con backend nuevo sigue con el texto viejo | B | Anotado en Compatibilidad |
| Proponía probar el filial caído esperando el aviso de error de red | B | Corregido: el central devuelve `false` en ese caso (`proxyImprimir` ataja la excepción); se prueba que salga el texto nuevo |

## Resultados (04/11)

- Gates con las dependencias de `develop` (`npm ci --legacy-peer-deps`, Electron 43.8.3): `verificar:imports` OK,
  `build:prod` sin errores, `electron:serve-tsc` OK, `verificar:arranque` «Arranque OK». Con el `node_modules` de otro
  checkout (Electron 24) `electron:serve-tsc` fallaba en `app/main.ts:398`: era el entorno, no el cambio.
- Runtime, desktop de la rama en `127.0.0.1:4200`, central de `develop` en el 8081, filial de filial#234 en el 8082:
  1. cola que rechaza → «No se pudo imprimir en ZZ RECHAZA 213: revisá que la sucursal esté online y que la impresora
     exista, esté encendida y acepte trabajos»;
  2. cola que acepta → «Ticket de prueba enviado a ZZ ACEPTA 213»;
  3. filial apagado → el mismo texto del caso 1 («No se pudo imprimir en ZZ ACEPTA 213: …»); el central registró
     «Error reenviando impresion».
- Colas `zz_` y filas de prueba borradas; procesos propios apagados.

## Sin verificar

- Electron: «Probar» intenta primero imprimir desde la PC y cae al servidor si falla; el texto es el mismo. No se
  prueba en Electron (no cambia ese camino).
