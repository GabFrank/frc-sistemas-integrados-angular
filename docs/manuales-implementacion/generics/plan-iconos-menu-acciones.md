# Plan — iconos en los menús de acciones (⋮) de las listas

Rama: `feature/ui-iconos-menu-acciones` (desde `develop` 059ce862). Pieza: **desktop** solamente.

## Qué resuelve

Varios menús de acciones por fila (ej. lista de cajas: «Ir a Caja», «Ir a Ventas», «Adicionar
observación») muestran solo texto, mientras que otros (cargos, monedas, factura legal, retiros por
verificar) ya llevan icono. Se unifica: todo `mat-menu-item` de **acción** lleva `<mat-icon>`.

## Patrón (ya usado en el repo)

```html
<button mat-menu-item (click)="onEditar(row)">
  <mat-icon>edit</mat-icon>
  <span>Editar</span>
</button>
```

- Texto suelto → se envuelve en `<span>` (lo que hace Material para alinear icono y texto).
- Si el botón ya trae `<span>` (ej. control de stock negativo), solo se antepone el icono.
- Textos que alternan (Cancelar/Habilitar) → el icono alterna con la **misma condición** que el
  texto, por interpolación en el template (no es llamada a función).
- No se toca ningún atributo del `<button>` (`*ngIf`, `[disabled]`, `(click)`, `style`): el cambio
  es solo de contenido.
- Font: `index.html` carga Material Icons de Google (versión vigente); todos los nombres usados son
  del set clásico.

## Alcance

116 ítems en 43 archivos (relevamiento por script sobre `develop`: 125 sin icono).

Quedan **fuera, a propósito** (9): no son acciones sino selectores de un valor dentro de un
submenú, y un icono repetido no agrega nada:
- `gestion-compras`: los 4 motivos de desvinculación.
- `gestion-proveedores-producto-dialog` y `gestion-productos-proveedor-dialog`: `{{ m.label }}`.
- `lotes-producto-dialog`: `{{ estadoLabels[estado] }}`.
- `venta-por-periodo`: dos botones `...` sin acción (placeholder).

## Fases

Una sola fase: es un cambio de templates sin lógica. Commit `feat(ui): ...` + push de la rama.

## Datos nuevos

Ninguno. N/A: no hay campos, columnas ni claves nuevas.

## Tests

- N/A batería unitaria para desktop (sin batería en ningún gate, §1 paso 9).
- `npm run check` (AOT de producción): valida que los 43 templates compilan.
- Prueba por pantalla (`ng serve -c web`): abrir el menú ⋮ en lista de cajas, ventas, transferencias
  (lista y edición), gastos, retiros, personas, compras; comprobar icono + texto alineados y que la
  acción sigue funcionando (un clic por menú). Los alternantes: ver Cancelar con `block` y una venta
  cancelada con Habilitar `check_circle`.

## Qué queda sin verificar

- Diálogos que solo se abren con datos puntuales (ej. edición de transferencia en etapas de
  transporte/recepción): se verifica que compilan; por pantalla, los que se puedan abrir con datos
  locales.

## Auditoría del plan (paso 5)

| Eje | Hallazgo | Qué se hizo |
|---|---|---|
| A | (media) La fuente de iconos sale solo de fonts.googleapis.com: sin internet se verían los nombres | **Descartado**: `src/styles.scss:6` importa `material-design-icons-iconfont` 6.7.0 empaquetado (woff2/ttf locales); el `<link>` de `index.html` es respaldo. Los 32 nombres existen en `MaterialIcons-Regular.json` de ese paquete (eje B) |
| A | (baja) 7 botones con `style="color: red"`: el tema fija el color del icono (`.mat-icon-no-color`), quedaría texto rojo e icono gris | **Aplicado**: en esos botones el icono lleva el mismo `style="color: red"` |
| A | Ningún spec/e2e busca estos ítems por texto; los 43 componentes importan `MaterialModule` (incluye `MatIconModule`); `MatIcon` pone `aria-hidden` | Sin acción |
| B | (baja) El script ubica los botones por línea y su regex corta en el primer `>`: frágil si cambia la base | Correr `--plan` sobre la base exacta y exigir `sin mapa []` y `mapa sin uso []` antes de `--apply`; el script no se reusa |
| B | (baja) Menús largos (transferencia, persona) ganan ~40 px de ancho | Mirarlos en la prueba por pantalla |
| B | Interpolación en `<mat-icon>` ya se usa en el repo (`vehiculo.component.html:4`); rollback = revertir el commit, sin datos ni contrato | Sin acción |

## Tabla de iconos

| Archivo:línea (develop) | Texto | Icono |
|---|---|---|
| `list-bienes-sucursal.component.html:140` | Historial de Movimientos | `history` |
| `list-equipos.component.html:145` | Editar | `edit` |
| `list-equipos.component.html:151` | Eliminar | `delete` |
| `list-inmuebles.component.html:103` | Generar Gasto Recurrente | `autorenew` |
| `list-muebles.component.html:62` | Editar | `edit` |
| `list-muebles.component.html:63` | Mover de sucursal | `swap_horiz` |
| `list-gps.component.html:90` | Configurar | `settings` |
| `list-gps.component.html:93` | Editar | `edit` |
| `list-gps.component.html:96` | Eliminar | `delete` |
| `list-vehiculo-sucursal.component.html:108` | Editar | `edit` |
| `list-vehiculo-sucursal.component.html:111` | Eliminar | `delete` |
| `list-vehiculos.component.html:106` | Editar | `edit` |
| `list-vehiculos.component.html:109` | Eliminar | `delete` |
| `list-roles.component.html:82` | Editar | `edit` |
| `list-roles.component.html:83` | Eliminar | `delete` |
| `list-sector.component.html:102` | Editar | `edit` |
| `list-sector.component.html:105` | Eliminar | `delete` |
| `list-sucursal.component.html:201` | Editar | `edit` |
| `cambio.component.html:77` | Actualizar | `edit` |
| `list-lote-de.component.html:187` | Editar | `edit` |
| `list-lote-de.component.html:188` | Ver documentos | `description` |
| `add-factura-legal-dialog.component.html:290` | Editar | `edit` |
| `add-factura-legal-dialog.component.html:291` | Eliminar | `delete` |
| `adicionar-gasto-dialog.component.html:255` | Ver | `visibility` |
| `adicionar-gasto-dialog.component.html:256` | Reimprimir | `print` |
| `adicionar-gasto-dialog.component.html:259` | Vuelto | `payments` |
| `adicionar-gasto-dialog.component.html:260` | Imprimir | `print` |
| `list-gastos.component.html:259` | Editar | `edit` |
| `list-gastos.component.html:260` | {{ gasto.cancelado ? 'Habilitar' : 'Cancelar' }} | `{{ gasto.cancelado ? 'check_circle' : 'block' }}` |
| `list-maletin.component.html:208` | Editar | `edit` |
| `maletin.component.html:79` | Editar | `edit` |
| `list-caja.component.html:441` | Ir a Caja | `point_of_sale` |
| `list-caja.component.html:442` | Ir a Ventas | `shopping_cart` |
| `list-caja.component.html:443` | Adicionar observación | `add_comment` |
| `main-caja-observacion.component.html:201` | Editar | `edit` |
| `main-caja-observacion.component.html:207` | Eliminar | `delete` |
| `main-caja-observacion.component.html:385` | Editar | `edit` |
| `main-caja-observacion.component.html:391` | Eliminar | `delete` |
| `main-caja-observacion.component.html:575` | Editar | `edit` |
| `main-caja-observacion.component.html:581` | Eliminar | `delete` |
| `adicionar-retiro-dialog.component.html:301` | Ver | `visibility` |
| `adicionar-retiro-dialog.component.html:302` | Reimprimir | `print` |
| `adicionar-retiro-dialog.component.html:305` | Imprimir | `print` |
| `list-retiro.component.html:201` | {{ retiro?.estado == "CANCELADO" ? "Habilitar" : "Cancelar" }} | `{{ retiro?.estado == 'CANCELADO' ? 'check_circle' : 'block' }}` |
| `add-venta-credito-dialog.component.html:134` | Ver | `visibility` |
| `add-venta-credito-dialog.component.html:135` | Vuelto | `payments` |
| `add-venta-credito-dialog.component.html:142` | Finalizar | `task_alt` |
| `add-venta-credito-dialog.component.html:149` | Imprimir | `print` |
| `list-venta-credito.component.html:333` | Finalizar | `task_alt` |
| `list-venta-credito.component.html:343` | Cancelar | `block` |
| `list-venta-credito.component.html:353` | Imprimir | `print` |
| `compras-search-producto-dialog.component.html:110` | Editar Producto | `edit` |
| `list-compra.component.html:313` | Ver | `visibility` |
| `list-compra.component.html:316` | Editar | `edit` |
| `list-compra.component.html:319` | Imprimir | `print` |
| `list-compra.component.html:322` | Cancelar | `block` |
| `edit-devolucion.component.html:189` | Editar | `edit` |
| `edit-devolucion.component.html:190` | Eliminar | `delete` |
| `list-devolucion.component.html:110` | Abrir | `open_in_new` |
| `entrada-salida.component.html:253` | Ir a Entrada | `open_in_new` |
| `entrada-salida.component.html:259` | Eliminar entrada | `delete` |
| `entrada-salida.component.html:518` | Ir a Salida | `open_in_new` |
| `entrada-salida.component.html:521` | Eliminar Salida | `delete` |
| `list-control-stock-negativo.component.html:109` | <span *ngIf="item.tipo === 'TRANSFERENCIA'">Ir a transferencia</span> <span *ngIf="item.tipo === 'VENTA'">Ir a venta</span> | `open_in_new` |
| `list-inventario.component.html:320` | Abrir | `open_in_new` |
| `list-movimiento-stock.component.html:327` | Ir a {{ movimiento?.tipoMovimiento \| enumToString }} | `open_in_new` |
| `edit-transferencia.component.html:448` | Editar | `edit` |
| `edit-transferencia.component.html:451` | Elegir lotes | `inventory_2` |
| `edit-transferencia.component.html:458` | Eliminar | `delete` |
| `edit-transferencia.component.html:621` | Confirmar | `check_circle` |
| `edit-transferencia.component.html:628` | Desconfirmar | `undo` |
| `edit-transferencia.component.html:635` | Modificar cantidad | `exposure` |
| `edit-transferencia.component.html:638` | Modificar vencimiento | `event` |
| `edit-transferencia.component.html:641` | Elegir lotes | `inventory_2` |
| `edit-transferencia.component.html:648` | Rechazar item | `cancel` |
| `edit-transferencia.component.html:805` | Confirmar | `check_circle` |
| `edit-transferencia.component.html:812` | Desconfirmar | `undo` |
| `edit-transferencia.component.html:819` | Solicitar modificación | `rate_review` |
| `edit-transferencia.component.html:822` | Rechazar item | `cancel` |
| `edit-transferencia.component.html:977` | Confirmar | `check_circle` |
| `edit-transferencia.component.html:984` | Desconfirmar | `undo` |
| `edit-transferencia.component.html:991` | Solicitar modificación | `rate_review` |
| `edit-transferencia.component.html:994` | Rechazar item | `cancel` |
| `list-transferencia.component.html:197` | Editar | `edit` |
| `list-transferencia.component.html:200` | Imprimir | `print` |
| `list-transferencia.component.html:203` | Generar QR | `qr_code` |
| `list-transferencia.component.html:206` | {{ notaRemisionPorTransferencia[transferencia.id] ? 'Imprimir nota de remisión' : 'Nota de remisión' }} | `description` |
| `list-transferencia.component.html:209` | Eliminar | `delete` |
| `generic-list-venta.component.html:373` | {{ venta?.estado == "CANCELADA" ? "Habilitar" : "Cancelar"}} | `{{ venta?.estado == 'CANCELADA' ? 'check_circle' : 'block' }}` |
| `generic-list-venta.component.html:376` | Adicionar observación | `add_comment` |
| `list-venta.component.html:744` | {{ venta?.estado == "CANCELADA" ? "Habilitar" : "Cancelar" }} | `{{ venta?.estado == 'CANCELADA' ? 'check_circle' : 'block' }}` |
| `list-venta.component.html:747` | Adicionar observación | `add_comment` |
| `main-venta-observacion.component.html:201` | Editar | `edit` |
| `main-venta-observacion.component.html:207` | Eliminar | `delete` |
| `main-venta-observacion.component.html:385` | Editar | `edit` |
| `main-venta-observacion.component.html:391` | Eliminar | `delete` |
| `main-venta-observacion.component.html:575` | Editar | `edit` |
| `main-venta-observacion.component.html:581` | Eliminar | `delete` |
| `list-delivery.component.html:218` | Ver | `visibility` |
| `list-delivery.component.html:219` | Vuelto | `payments` |
| `list-delivery.component.html:226` | Finalizar | `task_alt` |
| `list-delivery.component.html:233` | Imprimir | `print` |
| `list-clientes.component.html:162` | Editar | `edit` |
| `list-clientes.component.html:166` | Ver movimientos | `receipt_long` |
| `list-pre-registro-funcionario.component.html:120` | Ver funcionario | `visibility` |
| `list-pre-registro-funcionario.component.html:127` | Registrar funcionario | `person_add` |
| `list-pre-registro-funcionario.component.html:134` | Eliminar | `delete` |
| `list-persona.component.html:119` | Editar datos | `edit` |
| `list-persona.component.html:122` | {{persona?.isUsuario ? 'Ir a usuario' : 'Crear usuario'}} | `account_circle` |
| `list-persona.component.html:125` | {{persona?.isCliente ? 'Ir a cliente' : 'Crear cliente'}} | `person` |
| `list-persona.component.html:128` | {{persona?.isFuncionario ? 'Ir a funcionario' : 'Crear funcionario'}} | `badge` |
| `list-persona.component.html:131` | {{persona?.isProveedor ? 'Ir a proveedor' : 'Crear proveedor'}} | `local_shipping` |
| `list-producto.component.html:319` | Ver movimientos | `receipt_long` |
| `pdv-search-producto-dialog.component.html:245` | Editar Producto | `edit` |
| `reportes.component.html:28` | Cerrar | `close` |
| `reportes.component.html:29` | Abrir en navegador | `open_in_browser` |
