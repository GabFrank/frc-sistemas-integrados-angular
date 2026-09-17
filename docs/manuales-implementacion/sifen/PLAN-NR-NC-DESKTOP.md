# Plan (desktop) — UI de Nota de Remisión y Nota de Crédito electrónicas

_Cliente de `central/docs/manuales-implementacion/sifen/PLAN-NOTA-REMISION-NOTA-CREDITO.md` (plan
maestro: arquitectura, backend, migraciones, orden de despliegue). Este archivo cubre solo lo que
cambia en el desktop. Fase 1 = Nota de Remisión (NR), Fase 2 = Nota de Crédito (NC)._

Todo lo marcado `[ev: ...]` se verificó el 2026-09-17 contra el código de este repo.

---

## 1 · Contexto (lo que ya existe y se reutiliza)

- **Toda la administración de facturación habla con central** (`servidor=true`): lista, detalle,
  cancelación, XML/PDF, nominación `[ev: modules/financiero/factura-legal/factura-legal.service.ts:129-331]`.
  Las pantallas nuevas siguen ese mismo link: **ninguna operación de NR/NC va al filial**.
- **Lista de facturas** con `mat-menu` de acciones por fila
  (`list-factura-legal.component.html:405-453`): `onEdit`, `onImprimir`, `onCancelarFactura` (`.ts:625`),
  `onDescargarXml` (solo `esElectronica(factura)`), `onDescargarPdf`, imprimir en sucursal. Ahí va
  "Nota de crédito".
- **Cancelación actual**: `onCancelarFactura` abre `ConfirmDialogComponent` con "Solo Factura" /
  "Factura + Venta" y llama `cancelarFacturaLegal` (mutation de central que devuelve `String`
  `EXITO:…` / `ERROR…`) `[ev: list-factura-legal.component.ts:625-650]`.
- **Transferencias**: módulo real en `modules/operaciones/transferencia/` (⚠️ `modules/transferencias/`
  no es un NgModule; `TransferenciaTimelineDialogComponent` está declarado en `operaciones.module.ts`).
  `Transferencia.hojaRuta: HojaRuta { vehiculo: Vehiculo, chofer: Persona, fechaSalida, fechaLlegada,
  kmSalida, kmLlegada, acompanantes }` `[ev: transferencia.model.ts:~272]`. Ahí va "Nota de remisión".
- **Documento electrónico / lotes**: `modules/financiero/documento-electronico/` (`DocumentoElectronico`
  con `facturaLegal`, `tipoDocumento: string`, `estado: EstadoDE`) y `lote-de/list-lote-de` (menú
  "Documento electrónico", action `list-lote-de`, rol ADMIN). Se extiende para mostrar el tipo.
- **Menú**: `shared/components/side-mini-variant/side-mini-variant.component.ts` — 3 ediciones por
  entrada (import, item con `name/icon/action/visibilityRoles`, `case` en `onItemClick()` con
  `openTabIfAuthorized(ROLES.X, Component, "Título")`) `[ev: :542-548, :587-592, :1144-1152, :1248]`.
- **Roles**: `modules/personas/roles/roles.enum.ts`. `CREAR_FACTURAS` / `EDITAR_FACTURAS` existen y no
  se usan `[ev: roles.enum.ts:29-30]`. Gate de botones: flag calculado en `ngOnInit` con
  `mainService.tieneAlgunRol([...])` (`main.service.ts:34-40`), nunca función en el HTML.
- **Impresión padrón**: `ImpresionService.imprimir(nombre, generar, soloPdf)` +
  `ImprimirDialogComponent` (`shared/components/imprimir/`, `docs/IMPRESION.md`). La factura legal
  todavía usa el flujo legacy; **NR y NC nacen con el padrón, PDF A4 (`soloPdf=true`)**.
- **Selectores reutilizables**: `frc-searchable-select` (`shared/components/frc-searchable-select/`),
  `search-list-dialog` (búsqueda paginada genérica sobre una `Query` Apollo), `buscar-persona-dialog`
  (`modules/personas/persona/buscar-persona-dialog/`) para el chofer, `search-producto-dialog` para
  ítems manuales, `ClienteService.onSearchFromServer` / `onGetClientePorPersonaDocumentoDetallado`
  para el receptor, `SucursalService.onGetAllSucursales(true)` para sucursales.
- **Vehículos**: `modules/activos/vehiculos/vehiculo/models/vehiculo.model.ts` (`chapa`, `modelo`,
  `tipoVehiculo`) y su servicio Apollo.
- **Patrones**: lista = `list-transferencia.component.ts` (MatTable + paginator + `FormControl` sueltos
  + `SelectionModel`); diálogo = `add-factura-legal-dialog.component.ts` (controles reactivos sueltos,
  búsqueda de cliente por RUC); CRUD = `GenericCrudService` (`onCustomQuery`, `onCustomMutation`,
  `onSaveConDetalle` para cabecera + ítems en una llamada).

## 2 · Reglas que aplican a todo el trabajo

- Un `graphql-query.ts` por modelo + una clase por operación (`getNotaRemision.ts`, `saveNotaRemision.ts`,
  …). Inputs con fechas como `string` (`dateToString` en `toInput()`).
- Dark mode; texto centrado en tablas; strings en MAYÚSCULAS al guardar; sin clase `container`.
- Snackbars por `NotificacionSnackbarService`, confirmaciones por `DialogosService`, spinner por
  `CargandoDialogService`.
- Nada de lógica fiscal en el cliente: **los datos prellenados (receptor, salida, entrega, ítems,
  totales) los calcula central** (`prellenarNotaRemision`, `crearNotaCreditoDesdeFactura`); el
  desktop solo muestra, deja editar lo editable y envía.
- No crear módulos Angular nuevos: todo se declara en `financiero.module.ts` (166 declaraciones hoy).
- `npm run check` (AOT) **una sola vez al final** de todas las fases; durante el desarrollo, `ng serve`.
- Sin batería ejecutable en CI: la prueba es manual en browser (`npm run ng:serve` +
  `localStorage isLocal:false`, login con `frc-comercial/dev_user_cred.txt`).

## 3 · Datos nuevos que toca el cliente

| Dato | Escribe (desktop) | Lee (desktop) | Backend (central) |
|---|---|---|---|
| `NotaRemisionInput` (cabecera + ítems) | `AddNotaRemisionDialogComponent` → `saveNotaRemision` | `ListNotaRemisionComponent`, KuDE | `NotaRemisionService.crear` |
| `NotaRemisionPrellenada` | — | `AddNotaRemisionDialogComponent` (precarga por origen) | `prellenarNotaRemision(origen, referenciaId, sucursalId)` |
| `NotaCreditoInput` (motivo, descripción, [ítems parciales]) | `AddNotaCreditoDialogComponent` → `crearNotaCreditoDesdeFactura` | `ListNotaCreditoComponent`, lista de facturas (badge) | `NotaCreditoService.crearDesdeFactura` |
| `FacturaLegal.notasCredito[]` (campo nuevo, aditivo) | — | `list-factura-legal` (deshabilitar botón si ya hay NC total activa) | `FacturaLegalResolver` |
| `DocumentoElectronico.tipoDocumento` (`FACTURA`/`NOTA_CREDITO`/`NOTA_REMISION`) | — | `list-lote-de` (columna "Tipo"), diálogos de estado | ya existe como `String` |
| `inutilizarNumeros.tipoDE` (parámetro nuevo opcional) | `inutilizacion-numeros-tab` (selector de tipo) | — | `EventosSifenGraphQL.inutilizarNumeros` |
| `cancelarFacturaLegal` → `ERROR_PLAZO_NC:` (valor nuevo del `String`) | — | `onCancelarFactura` → ofrece "Emitir nota de crédito" | `FacturaLegalGraphQL.cancelarFacturaLegal` |
| `ROLES.FACTURACION_VER / _NR_EMITIR / _NC_EMITIR / _ANULAR` | — | menú, flags de botones | seed `V225.5` en `personas.role` |

## 4 · Fases

### FASE 1 — Nota de Remisión (después de que central tenga la Fase 1 mergeada)

**1.1 Modelo y GraphQL** — `modules/financiero/nota-remision/`
- `nota-remision.model.ts`: `NotaRemision`, `NotaRemisionItem`, `NotaRemisionInput`,
  `NotaRemisionItemInput`, `NotaRemisionPrellenada`; enums TS espejo de los del `.graphqls`
  (`MotivoEmisionNotaRemision`, `ResponsableEmisionNr`, `TipoTransporteNr`, `ModalidadTransporteNr`,
  `OrigenNotaRemision`).
- `graphql/graphql-query.ts` + una clase por operación: `notaRemision`, `notaRemisiones` (paginado
  estándar con `getTotalPages/getTotalElements/getNumberOfElements/isFirst`),
  `notaRemisionPorTransferencia`, `prellenarNotaRemision`, `imprimirNotaRemision`, `saveNotaRemision`,
  `generarYEnviarNotaRemision`, `reenviarNotaRemision`, `anularNotaRemision`.
- `nota-remision.service.ts` sobre `GenericCrudService`, todo con `servidor=true`.

**1.2 `ListNotaRemisionComponent`** (patrón `list-transferencia`): filtros fecha desde/hasta,
sucursal, origen, estado SIFEN, texto (número / receptor / matrícula); columnas número formateado
(`est-pexp-0000001`), fecha, origen (con link a la transferencia o factura), receptor, vehículo
(matrícula), chofer, estado DE (chip por `EstadoDE`), CDC abreviado; acciones por fila: ver, KuDE
(`ImpresionService.imprimir('Nota de remisión', generar, true)`), enviar / reenviar (visible si el DE
está `PENDIENTE`, o `EN_LOTE` con lote en `ERROR_ENVIO`/`ERROR_RED`/`ERROR_PERMANENTE`, o `RECHAZADO`
— hallazgo B2 de la auditoría: un envío fallido deja el DE en `EN_LOTE`, no en `PENDIENTE`; el
backend consulta el CDC antes de reenviar), consultar estado (`consultarLote` existente), anular (rol `FACTURACION_ANULAR`,
`DialogosService.confirm` + motivo), descargar XML. Polling opcional cada 5 min como transferencias.

**1.3 `AddNotaRemisionDialogComponent`** (cabecera + ítems en un diálogo, guardado por
`onSaveConDetalle` o mutation custom):
- Paso 0 — origen: `TRANSFERENCIA` (busca transferencia por id / abierto desde el botón),
  `FACTURA` (busca factura electrónica aprobada por número o CDC), `MANUAL`.
- Al elegir origen + referencia: `prellenarNotaRemision` → rellena receptor, salida, entrega,
  transporte, vehículo, chofer, ítems, motivo sugerido. Todo editable salvo lo que fija SIFEN por
  motivo (motivo `TRASLADO_ENTRE_LOCALES` → receptor bloqueado a la propia empresa).
- Sección **Receptor**: búsqueda de cliente por RUC/nombre (reusa el patrón de
  `add-factura-legal-dialog.buscarCliente`), nombre/RUC/dirección/departamento/ciudad obligatorios
  (SIFEN no admite innominado en NRE).
- Sección **Traslado**: motivo (select de enum), responsable (default `EMISOR_FACTURA`), fecha
  inicio/fin, km estimado, fecha estimada de factura (solo visible si motivo `TRASLADO_POR_VENTAS` sin
  factura asociada).
- Sección **Salida / Entrega**: dirección, departamento, código de ciudad, ciudad (precargados).
- Sección **Transporte**: tipo (`PROPIO`/`TERCERO`), modalidad (default `TERRESTRE`); si `TERCERO`,
  nombre/RUC/dirección del transportista.
- Sección **Vehículo**: `frc-searchable-select` sobre vehículos activos (muestra `chapa — marca`),
  con snapshot editable de marca (aviso si > 10 caracteres: central la abrevia) y matrícula.
- Sección **Chofer**: `buscar-persona-dialog` → nombre/documento/dirección editables.
- Sección **Ítems**: tabla `producto/presentación`, descripción, cantidad, unidad; agregar con
  `search-producto-dialog`; sin precio ni IVA.
- Guardar → `saveNotaRemision`; luego `DialogosService.confirm("¿Generar y enviar a SIFEN ahora?")`
  → `generarYEnviarNotaRemision` → muestra estado + CDC; ofrece imprimir el KuDE.

**1.4 Puntos de entrada**
- `list-transferencia` / `edit-transferencia`: botón "Nota de remisión" (visible con rol
  `FACTURACION_NR_EMITIR` o ADMIN, deshabilitado si la transferencia está `CANCELADA` o ya tiene NR
  activa, dato que llega en `notaRemisionPorTransferencia`). Abre el diálogo con origen
  `TRANSFERENCIA`.
- `list-factura-legal`: acción "Nota de remisión" (solo `esElectronica` + `activo`).
- Menú Financiero → Caja y Operativa: "Notas de remisión" (`icon: local_shipping`, action
  `list-nota-remision`, `visibilityRoles: [ROLES.FACTURACION_VER, ROLES.FACTURACION_NR_EMITIR, ROLES.ADMIN]`).

**1.5 Documento electrónico**
- `documento-electronico.model.ts:10`: `facturaLegal?: FacturaLegal | null` (hoy está tipado como
  obligatorio; con `strictNullChecks: false` no lo atrapa el compilador — hallazgo A6 de la
  auditoría). Agregar `notaCredito?` y `notaRemision?` opcionales.
- `list-lote-de`: columna "Tipo" desde `documentoElectronico.tipoDocumento` y número formateado; el
  detalle deja de asumir `facturaLegal != null` (hoy la lista de lotes no pide `facturaLegal` en su
  query, así que el riesgo es solo del código nuevo `[ev: lote-de/graphql/graphql-query.ts]`).
- `inutilizacion-numeros-tab`: selector "Tipo de documento" (Factura / Nota de crédito / Nota de
  remisión) que viaja en el nuevo parámetro `tipoDE`.

**1.6 Roles**: agregar a `roles.enum.ts` `FACTURACION_VER = "FACTURACION VER"`,
`FACTURACION_NR_EMITIR = "FACTURACION NR EMITIR"`, `FACTURACION_NC_EMITIR = "FACTURACION NC EMITIR"`,
`FACTURACION_ANULAR = "FACTURACION ANULAR"` (mismo texto que el seed de central, con espacios).

**1.7 Prueba manual en browser** (contra central local con `sifen.ambiente=TEST`): crear NR de cada
origen, ver estado, imprimir KuDE, anular, inutilizar rango de NR. Registrar los CDC obtenidos en la
descripción del PR.

### FASE 2 — Nota de Crédito (después de que central tenga la Fase 2 mergeada)

**2.1 Modelo y GraphQL** — `modules/financiero/nota-credito/`: `NotaCredito`, `NotaCreditoItem`,
`NotaCreditoInput`, enum `MotivoEmisionNotaCredito` (8 valores); operaciones `notaCredito`,
`notaCreditos`, `notaCreditosPorFactura`, `imprimirNotaCredito`, `crearNotaCreditoDesdeFactura`,
`generarYEnviarNotaCredito`, `reenviarNotaCredito`, `anularNotaCredito`. `FacturaLegal` gana
`notasCredito` en `factura-legal.model.ts` y en las queries `facturaLegales` / `facturaLegal`.

**2.2 `AddNotaCreditoDialogComponent`** (abierto desde la factura): cabecera de solo lectura de la
factura (número, fecha, cliente, moneda, total, CDC), select de motivo, descripción libre (solo para
el KuDE), tabla de ítems de la factura **de solo lectura** en el MVP (si se aprueba la NC parcial:
cantidad editable ≤ facturada y checkbox por ítem; los totales los devuelve central), botón
"Emitir" → `crearNotaCreditoDesdeFactura` → confirmación "¿Enviar a SIFEN ahora?" →
`generarYEnviarNotaCredito` → estado + CDC + imprimir.

**2.3 `ListNotaCreditoComponent`**: filtros fecha/sucursal/estado/texto; columnas número, fecha,
factura asociada, cliente, motivo, total (con moneda), estado DE, CDC; acciones KuDE, reenviar,
consultar, anular, XML.

**2.4 Integración en `list-factura-legal`**
- Acción "Nota de crédito" entre "Cancelar" y "Descargar XML": habilitada solo si `esElectronica`,
  `activo`, `documentoElectronico.estado === 'APROBADO'` y no existe NC total activa
  (`notasCredito`), y el usuario tiene `FACTURACION_NC_EMITIR` (flag en `ngOnInit`).
- `ejecutarCancelacion`: si el `String` de respuesta empieza con `ERROR_PLAZO_NC:`, mostrar
  `DialogosService.confirm("Pasaron más de 48 h desde la aprobación. SIFEN no acepta la cancelación.
  ¿Emitir una nota de crédito?")` → abre `AddNotaCreditoDialogComponent`.
- Badge/columna "NC" en la grilla cuando `notasCredito.length > 0`.

**2.5 Menú**: Financiero → Caja y Operativa: "Notas de crédito" (`icon: request_quote`, action
`list-nota-credito`, roles `FACTURACION_VER`, `FACTURACION_NC_EMITIR`, `ADMIN`).

**2.6 Prueba manual**: NC total sobre factura PYG y sobre factura USD; cancelación de una factura de
72 h → aparece la oferta de NC; anular NC; KuDE.

### Cierre (una vez por PR)
- `npm run check` (redirigido a archivo, leer el log entero, sin `grep | head` sobre la primera
  corrida; `NODE_OPTIONS=--max_old_space_size=8192`).
- PR a `develop` con las seis secciones (`Qué resuelve`, `Cómo probarlo`, `Impacto en DB` = ninguno,
  `Impacto en rollback`, `Riesgo`, `Nota de despliegue` = "cliente y backend van juntos por canal:
  no promover a `beta` antes que el central de farmacia con NR/NC").
- Este archivo se borra en el PR final; lo que sobrevive va a `docs/HOW_TO.md` / `docs/IMPRESION.md`
  ("Dónde ya está aplicado": NR y NC) y a la skill `frc-desktop` → `feature-modules.md`.

## 4b · Hallazgos de la auditoría del plan que tocan al cliente

| # | Hallazgo | Qué se hizo |
|---|---|---|
| A5 | `tipoDE` de `inutilizarNumeros` debe ser opcional en el schema (el desktop actual no lo envía) | Central lo declara sin `!`; acá 1.5 lo agrega como selector con default Factura |
| A6 | `documento-electronico.model.ts` tipa `facturaLegal` como no opcional | 1.5 corrige el tipo |
| B2 | Un envío fallido deja el DE en `EN_LOTE` con lote en error; "Reenviar" solo para `PENDIENTE`/`RECHAZADO` no lo mostraba | 1.2 y 2.3: condición del botón ampliada |
| — | Verificado: `ejecutarCancelacion` trata cualquier `ERROR…` desconocido como error genérico (`list-factura-legal.component.ts:660-666`) → el desktop viejo no se rompe con `ERROR_PLAZO_NC:` | Sin cambio |

## 5 · Riesgos propios del cliente

| Riesgo | Mitigación |
|---|---|
| El desktop de un canal pide `notaRemisiones` a un central que no la tiene (incidente v4.1.0, 2026-08-19) | Orden de PRs del plan maestro §7; nunca promover el desktop antes que su backend |
| `list-lote-de` / diálogos de DE asumen `facturaLegal` presente → `undefined` en NR/NC | 1.5 revisa todos los lectores de `documentoElectronico.facturaLegal` (grep en `modules/financiero/documento-electronico/**`) |
| Usuario postergó el update: desktop viejo contra central nuevo | Todo lo del backend es aditivo (campos nuevos, parámetro opcional, valor nuevo del `String` de cancelación que el cliente viejo muestra como error genérico) |
| Marca de vehículo > 10 caracteres rechazada por SIFEN | El diálogo avisa y central abrevia; el KuDE muestra la marca completa del snapshot |

## 6 · Sin verificar
- Que `search-producto-dialog` sirva tal cual para ítems de NR (devuelve `Producto` + `Presentacion`;
  falta confirmar que expone unidad de medida).
- Que `buscar-persona-dialog` devuelva `documento` y `direccion` (necesarios para el chofer) sin
  una segunda query.
- Que `ReportesComponent` (visor del padrón de impresión) renderice un PDF A4 apaisado si el KuDE de
  NR lo requiere — la referencia usa vertical; se asume vertical.
