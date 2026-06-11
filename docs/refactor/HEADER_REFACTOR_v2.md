# Header — Refactor v2 (2026-05)

Refactor del componente `app-header` (`src/app/shared/components/header/`) para modernizar layout, sumar cotizaciones y reloj, y reorganizar el estado de los servidores.

## Inventario de funcionalidades

El header se divide en **5 zonas** dentro de un `mat-toolbar` rojo (color primary, altura 72px).

### 1. Brand (izquierda)

- Texto plano (no clickable) con el nombre de la sucursal/cloud.
- Etiqueta `DEV` cuando `isDevMode()` está activo.
- Subtítulo `FRC Sistemas v{appVersion}`.

### 2. Cotizaciones (centro-izquierda)

- Stack vertical de monedas soportadas: **USD** (DOL) y **REAL** (REA).
- Cada fila muestra `compra mercado / venta mercado` con formato sin decimales (`number:'1.0-0'`).
- Tooltip por fila: timestamp de última actualización (`Actualizado: dd/MM HH:mm`).
- **Botón refresh** a la izquierda del stack: dispara fetch inmediato, spin durante 1.5s, disabled mientras refresca.
- Si todavía no hay datos: placeholder `Sin cotización`.

#### Fuente de datos

`CotizacionHeaderService` (`src/app/shared/services/cotizacion-header.service.ts`):

- Carga monedas con `MonedaService.onGetAll()` filtrando denominaciones `DOLAR*` y `REAL*`.
- Por cada moneda, consulta `CambioService.getUltimoCambioPorMonedaId(id)`.
- Polling automático cada **10 minutos** (`REFRESH_MS`).
- BehaviorSubject `cotizaciones$` reactivo, consumido con `async` pipe.
- Bootstrap al login (escucha `MainService.authenticationSub`).
- Método `refresh()` expuesto para refresh manual.

### 3. Reloj (centro)

- Hora `HH:mm:ss` con tick **1 segundo** vía `timer(0, 1000).pipe(map(() => new Date()))`.
- Fecha localizada `EEE dd MMM` usando locale `es-PY` registrado en `app.module.ts`.

### 4. Status servers (centro-derecha)

- Dots compactos verde/rojo apilados verticalmente.
- `LOCAL` solo visible cuando `isLocal === true` (config local).
- `CENTRAL` siempre visible.
- Spinner mini mientras el estado es `null` (conectando).
- Animación `blink` solo en el dot afectado cuando `serverWarning` está activo.
- Tooltip por dot con descripción del estado.

### 5. Acciones + usuario (derecha)

| Elemento | Acción |
|---|---|
| 🔍 Search | Abre `SearchBarDialogComponent` |
| ⚙ Settings | Menú con QR sucursal, Configuración del Sistema (solo rol `SOPORTE`), Cambiar sucursal |
| 📧 Notificaciones | Emite `openNotificationsEvent` al parent. Badge verde con contador (max `99+`) |
| 👤 Usuario | Avatar circular con icono `person`, nombre + rol; menú con Salir/Entrar |

Nombre completo si entra en `max-width: 280px`, ellipsis si excede.

## Layout HTML

```
[Burger] [Brand] | [spacer] | [Refresh][Cotiz stack] | [Reloj] | [Status] | [spacer] | [Search ⚙ 📧 Usuario]
```

Dos `spacer` flex 1 empujan el bloque central (Cotiz/Reloj/Status) al centro. Dividers verticales sutiles (`rgba(255,255,255,.18)`) entre zonas.

## Reglas aplicadas

- **Dark mode primary rojo** — sin cambio de paleta.
- **Sin funciones desde HTML** — todo via `async` pipe (`cotizaciones$`, `now$`, `unreadCount$`) o propiedades cacheadas (`userMainRole`, `appVersion`).
- **Sin módulos nuevos** — service va en `shared/services/`, todo lo demás dentro de la carpeta del componente.
- **Material 15**: contenido de `<button mat-button>` envuelto en `<span class="..-inner">` para que la clase responda al CSS (Material wrappea hijos del botón en `.mat-button-wrapper`).

## Cómo extender

### Agregar otra moneda al stack

Editar `DEFAULT_DENOMS` en `cotizacion-header.service.ts`:

```ts
const DEFAULT_DENOMS = ['DOLAR', 'DOLARES', 'REAL', 'REALES', 'PESO ARGENTINO'];
```

Y agregar el rank en `denomRank()` para que mantenga orden consistente.

### Cambiar intervalo de polling

`REFRESH_MS` en `cotizacion-header.service.ts`. Default 10 min. Cambiar afecta a todos los clientes.

### Sumar refresh on focus (sugerido)

En `app.component.ts` o donde se inicializa Electron renderer, escuchar `window` focus event y llamar `cotizacionHeaderService.refresh()`. No implementado actualmente.

### Reordenar zonas

Editar `header.component.html`. Las clases `.frc-header__zone--*` aplican estilos por tipo (brand/cotiz/clock/status/actions). Los `.frc-header__spacer` controlan dónde se centra el bloque.

## Responsive

| Ancho | Comportamiento |
|---|---|
| `< 1280px` | Oculta stack nombre/rol del usuario, caret. Avatar visible |
| `< 1100px` | Oculta fecha del reloj |
| `< 980px` | Oculta cotizaciones completas |

## Archivos

- `src/app/shared/components/header/header.component.html`
- `src/app/shared/components/header/header.component.scss`
- `src/app/shared/components/header/header.component.ts`
- `src/app/shared/services/cotizacion-header.service.ts` (nuevo)

## Backend

Sin cambios. Consume queries existentes:

- `monedasGetAll` (todas las monedas activas)
- `ultimoCambioPorMonedaId(id)` (último cambio por moneda)

No requiere migraciones Flyway ni cambios en schema GraphQL.

## PR

[#80 — feat(header): refactor moderno con cotizaciones, reloj y status](https://github.com/GabFrank/frc-sistemas-integrados-angular/pull/80) — merged a `develop` el 2026-05-18.
