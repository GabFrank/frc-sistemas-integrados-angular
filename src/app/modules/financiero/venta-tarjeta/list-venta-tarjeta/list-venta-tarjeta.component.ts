import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { PageInfo } from '../../../../app.component';
import { textoMotivoNoCompletado, VentaTarjeta } from '../venta-tarjeta.model';
import { VentaTarjetaService } from '../venta-tarjeta.service';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { TerminalPosService } from '../../terminal-pos/terminal-pos.service';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { MatDialog } from '@angular/material/dialog';
import { ConfiguracionVentaTarjetaDialogComponent } from '../configuracion-venta-tarjeta-dialog/configuracion-venta-tarjeta-dialog.component';
import { RegistrarVentaTarjetaDialogComponent } from '../qr-pos/registrar-venta-tarjeta-dialog/registrar-venta-tarjeta-dialog.component';
import { MonedaService } from '../../moneda/moneda.service';
import { DecimalesPorMoneda } from '../qr-pos/qr-pos-parser';
import { VentasTarjetaCajaDialogComponent } from '../ventas-tarjeta-caja-dialog/ventas-tarjeta-caja-dialog.component';

@UntilDestroy()
@Component({
  selector: 'app-list-venta-tarjeta',
  templateUrl: './list-venta-tarjeta.component.html',
  styleUrls: ['./list-venta-tarjeta.component.scss']
})
export class ListVentaTarjetaComponent implements OnInit {

  ROLES = ROLES;

  /**
   * Cliente apuntando al CENTRAL. Esta pantalla LEE de central siempre, asi que se ve igual; lo que
   * no existe ahi son las acciones.
   *
   * Se lee UNA vez en `ngOnInit`: `isLocal()` pega a localStorage y el template no puede llamar
   * funciones.
   */
  modoLectura = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<VentaTarjeta>([]);
  displayedColumns = ['id', 'ventaId', 'sucursal', 'terminal', 'codigo', 'monto', 'montoEscaneado', 'estado', 'creadoEn', 'acciones'];
  decimalesPorMoneda: DecimalesPorMoneda = {};
  selectedPageInfo: PageInfo<VentaTarjeta>;
  pageIndex = 0;
  pageSize = 15;
  today = new Date();
  fechaFormGroup: FormGroup;
  idControl = new FormControl(null);
  ventaIdControl = new FormControl(null);
  sucursalIdControl = new FormControl(null);
  terminalDescripcionControl = new FormControl(null);
  terminalCodigoControl = new FormControl(null);
  estadoControl = new FormControl(null);
  fechaDesdeControl = new FormControl(null);
  fechaHastaControl = new FormControl(null);

  sucursales: Sucursal[] = [];
  terminalesDescripciones: string[] = [];
  terminales: { descripcion: string; codigo: string }[] = [];
  estados = ['PENDIENTE', 'COMPLETADO', 'CANCELADO', 'NO_COMPLETADO'];

  get terminalesCodigos(): string[] {
    const desc = this.terminalDescripcionControl.value;
    const source = desc ? this.terminales.filter(t => t.descripcion === desc) : this.terminales;
    return [...new Set<string>(source.map(t => t.codigo).filter(Boolean))].sort();
  }

  constructor(
    private ventaTarjetaService: VentaTarjetaService,
    private sucursalService: SucursalService,
    private terminalPosService: TerminalPosService,
    public mainService: MainService,
    private matDialog: MatDialog,
    private monedaService: MonedaService
  ) {}

  ngOnInit(): void {
    this.modoLectura = !this.mainService.isLocal();

    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 5);

    this.fechaDesdeControl.setValue(aux);
    this.fechaHastaControl.setValue(hoy);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaDesdeControl,
      fin: this.fechaHastaControl,
    });

    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe(res => this.sucursales = res ?? []);

    // Sin filtrar por serie ni sucursal: esto arma el combo de terminales de la pantalla, que
    // ofrece todas las activas.
    this.terminalPosService.onFilter(null, null, null, null, true, 0, 200, true)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.terminales = (res?.getContent ?? []).map((t: any) => ({ descripcion: t.descripcion, codigo: t.codigo }));
        const descripciones = this.terminales.map(t => t.descripcion).filter(Boolean);
        this.terminalesDescripciones = [...new Set<string>(descripciones)].sort();
      });

    this.terminalDescripcionControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.terminalCodigoControl.setValue(null, { emitEvent: false }));

    this.monedaService.onGetAll(true)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.decimalesPorMoneda = (res || []).reduce((acc, m) => {
          if (m?.id != null) acc[m.id] = m.decimales ?? 0;
          return acc;
        }, {} as DecimalesPorMoneda);
      });

    this.onGetData();
  }

  onGetData(): void {
    const params: any = {
      page: this.pageIndex,
      size: this.pageSize
    };
    if (this.idControl.value) params.id = Number(this.idControl.value);
    if (this.ventaIdControl.value) params.ventaId = Number(this.ventaIdControl.value);
    if (this.sucursalIdControl.value) params.sucursalId = Number(this.sucursalIdControl.value);
    if (this.terminalDescripcionControl.value) params.terminalDescripcion = this.terminalDescripcionControl.value;
    if (this.terminalCodigoControl.value) params.terminalCodigo = this.terminalCodigoControl.value;
    if (this.estadoControl.value) params.estado = this.estadoControl.value;
    if (this.fechaDesdeControl.value) params.fechaDesde = new Date(this.fechaDesdeControl.value).toISOString().slice(0, 19);
    if (this.fechaHastaControl.value) {
      const hasta = new Date(this.fechaHastaControl.value);
      hasta.setHours(23, 59, 59);
      params.fechaHasta = hasta.toISOString().slice(0, 19);
    }

    this.ventaTarjetaService.onFiltrar(params)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res) {
          this.selectedPageInfo = res;
          this.dataSource.data = (res.getContent ?? []).map(item => this.aFilaConMoneda(item));
        }
      });
  }

  /**
   * Agrega a la fila el simbolo y el formato numerico de su moneda.
   *
   * Devuelve un objeto NUEVO: los resultados de Apollo vienen congelados y asignarles props de
   * display revienta en dev.
   *
   * La moneda sale del REGISTRO. Se cae a la de la terminal solo para las filas anteriores a que
   * la columna existiera (`V219.5` / `V92.5`), y a guaranies sin decimales como ultimo recurso,
   * que es lo que esas filas venian mostrando.
   */
  private aFilaConMoneda(item: VentaTarjeta): VentaTarjeta {
    const moneda = item?.moneda ?? item?.terminalPos?.moneda;
    const decimales = moneda?.decimales ?? 0;
    return {
      ...item,
      simboloMoneda: moneda?.simbolo ?? 'Gs.',
      digitosMoneda: `1.${decimales}-${decimales}`,
      // El motivo en palabras se resuelve acá: el template no puede llamar funciones.
      motivoTexto: textoMotivoNoCompletado(item?.noCompletadoMotivo)
    };
  }

  onFilter(): void {
    this.pageIndex = 0;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.onGetData();
  }

  onLimpiarFiltros(): void {
    this.idControl.setValue(null);
    this.ventaIdControl.setValue(null);
    this.sucursalIdControl.setValue(null);
    this.terminalDescripcionControl.setValue(null);
    this.terminalCodigoControl.setValue(null);
    this.estadoControl.setValue(null);
    this.fechaDesdeControl.setValue(null);
    this.fechaHastaControl.setValue(null);
    this.onFilter();
  }

  handlePageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetData();
  }

  onGenerarPdf(): void {
    const params: any = {};
    if (this.idControl.value) params.id = Number(this.idControl.value);
    if (this.ventaIdControl.value) params.ventaId = Number(this.ventaIdControl.value);
    if (this.sucursalIdControl.value) params.sucursalId = Number(this.sucursalIdControl.value);
    if (this.terminalDescripcionControl.value) params.terminalDescripcion = this.terminalDescripcionControl.value;
    if (this.terminalCodigoControl.value) params.terminalCodigo = this.terminalCodigoControl.value;
    if (this.estadoControl.value) params.estado = this.estadoControl.value;
    if (this.fechaDesdeControl.value) params.fechaDesde = new Date(this.fechaDesdeControl.value).toISOString().slice(0, 19);
    if (this.fechaHastaControl.value) {
      const hasta = new Date(this.fechaHastaControl.value);
      hasta.setHours(23, 59, 59);
      params.fechaHasta = hasta.toISOString().slice(0, 19);
    }

    this.ventaTarjetaService.onImprimirReporteVentaTarjeta(params);
  }

  onAbrirConfiguracion(): void {
    this.matDialog.open(ConfiguracionVentaTarjetaDialogComponent, {
      width: '560px',
      disableClose: false,
      panelClass: 'custom-dialog-container'
    });
  }

  /**
   * Completar un PENDIENTE desde acá — es el camino "desde el PDV" que el aviso de cierre de
   * caja promete (adicionar-caja-dialog.component.ts). Antes de esta pantalla, un PENDIENTE
   * pospuesto solo se podía terminar por celular o forzando el cierre de caja.
   * <p>
   * La mutation de completar va contra el FILIAL de la sucursal de esta fila (VentaTarjetaService
   * .onCompletar usa servidor=false, y esta pantalla lista con datos del CENTRAL). Si quien
   * completa no está en la misma sucursal que la fila, el filial local no la va a tener y va a
   * devolver un error claro ("No existe la venta con tarjeta..."). Por eso el botón solo aparece
   * para filas de la sucursal donde está parado ahora mismo — completar la de otra sucursal desde
   * acá no puede funcionar y no tiene sentido ofrecerlo.
   * <p>
   * ⚠️ <b>Y tampoco si el cliente apunta al central</b> (`isLocal: false`). Ese caso faltaba: el
   * razonamiento de arriba habla del «filial local» dando por sentado que existe, y desde la web
   * contra central no existe —`graphql-connection.service.ts:280` no crea el link local, así que
   * `completarVentaTarjeta` se resolvía contra un backend que no la tiene—. `sucursalActual` está
   * igual y coincide igual, así que el botón se mostraba y recién fallaba al apretarlo, con un
   * error de GraphQL que no mencionaba la configuración. Es el perfil MÁS probable de esta
   * pantalla: el supervisor que audita la red entra por la web.
   */
  puedeCompletarDesdeAqui(item: VentaTarjeta): boolean {
    if (this.modoLectura) return false;
    // Number() en los dos lados, y NO ===: `Sucursal.id` es un `ID` de GraphQL y llega como
    // STRING ("24"), mientras `VentaTarjeta.sucursalId` es un `Int` y llega como NÚMERO (24).
    // Con comparación estricta esto daba false siempre y el botón no aparecía en ninguna fila,
    // sin ningún error visible: la pantalla se veía bien pero la acción no existía.
    const sucursalFila = Number(item.sucursalId);
    const sucursalActual = Number(this.mainService.sucursalActual?.id);
    return item.estado === 'PENDIENTE'
      && !isNaN(sucursalFila)
      && !isNaN(sucursalActual)
      && sucursalFila === sucursalActual;
  }

  /**
   * Si desde esta fila se puede abrir el diálogo de su caja.
   *
   * <b>La lista es el índice; el diálogo es el taller.</b> Acá se ve toda la red y se filtra; las
   * acciones —completar, dejar sin conciliar, reabrir— viven en el diálogo de la caja, que corre
   * contra el filial, que es el único backend que sabe escribir esta tabla.
   *
   * ⚠️ <b>Exige `isLocal` y no sólo la sucursal</b>, por la misma razón que `puedeCompletarDesdeAqui`
   * y por una más, medida: el diálogo carga con `filtrarVentasTarjetaPorCaja`, que **sólo existe en
   * el filial**. Contra central no hay ni modo lectura posible: la tabla saldría vacía. Por eso en
   * ese caso la puerta no se ofrece y el rastro de los NO_COMPLETADO se lee acá mismo, en la
   * columna de estado, que sí se sirve desde central.
   */
  puedeAbrirLaCaja(item: VentaTarjeta): boolean {
    if (this.modoLectura) return false;
    const cajaId = item?.caja?.id ?? item?.cajaId;
    if (cajaId == null) return false;
    // Number() en los dos lados y no ===: `Sucursal.id` llega como STRING y `sucursalId` como
    // NÚMERO. Ver el comentario de `puedeCompletarDesdeAqui`.
    const sucursalFila = Number(item.sucursalId);
    const sucursalActual = Number(this.mainService.sucursalActual?.id);
    return !isNaN(sucursalFila) && !isNaN(sucursalActual) && sucursalFila === sucursalActual;
  }

  /**
   * Abre el diálogo de la caja de esta fila.
   *
   * El diálogo ya servía para una caja cerrada —recibe `cajaId`, filtra por él y no chequea el
   * estado de la caja en ningún lado—, así que no hubo que adaptarlo. Que se abriera sólo desde el
   * PDV con la caja del turno era por dónde se entraba, no una restricción suya.
   */
  onAbrirLaCaja(item: VentaTarjeta): void {
    const cajaId = item?.caja?.id ?? item?.cajaId;
    if (cajaId == null) return;
    this.matDialog
      .open(VentasTarjetaCajaDialogComponent, {
        // Mismas opciones que la otra puerta (Utilitarios F1 del PDV): es el mismo diálogo y
        // tiene que abrirse igual, no parecerse a dos pantallas según por dónde se entró.
        //
        // ⚠️ `darkMode` HOY no cambia nada, medido: se quitó y se puso la clase sobre el pane en
        // vivo y ni una etiqueta, ni un input, ni la cabecera de la tabla, ni el paginador
        // cambiaron de color — la app ya aplica el tema oscuro globalmente, y el panel de los
        // `mat-select` ni siquiera cuelga de este pane (se monta en el overlay global). Va igual
        // para que las dos puertas pasen exactamente las mismas opciones: si algún día el tema
        // global deja de ser oscuro, la diferencia aparecería en una sola de las dos y nadie
        // sabría por qué.
        data: { cajaId: Number(cajaId) },
        width: '85vw',
        height: '80vh',
        maxWidth: '85vw',
        disableClose: false,
        autoFocus: true,
        panelClass: 'darkMode',
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      // Se recarga al volver: adentro se pudo haber completado, marcado o reabierto.
      .subscribe(() => this.onGetData());
  }

  onCompletarPendiente(item: VentaTarjeta): void {
    this.matDialog.open(RegistrarVentaTarjetaDialogComponent, {
      data: {
        ventaTarjetaId: item.id,
        sucursalId: item.sucursalId,
        // Necesario para traer los cobros con tarjeta de la venta y poder vincular el cupón
        // a la línea correcta cuando hay más de una.
        ventaId: item.venta?.id,
        monto: item.monto,
        // La del registro manda: la de la terminal es configuración mutable y no describe lo
        // que se cobró. Respaldo a la de la terminal solo para filas viejas sin moneda propia.
        monedaSimbolo: item.simboloMoneda,
        terminalDescripcion: [item.terminalPos?.descripcion, item.terminalPos?.codigo].filter(Boolean).join(' - '),
        proveedorServicioId: item.terminalPos?.proveedorServicio?.id,
        // De acá sale qué camino se le ofrece al cajero y cuál se le cierra.
        formatoTerminalPos: item.terminalPos?.formatoTerminalPos,
        // La terminal va a la captura: con ella el filial aplica el formato y devuelve
        // los campos ya separados, en vez de texto crudo que el cajero transcribe igual.
        terminalPosId: item.terminalPos?.id,
        // La configuracion por aparato tiene que valer por las DOS puertas: si no, apagar la carga
        // a mano la cierra durante la venta y la deja abierta al completar el pendiente.
        cargaManualPermitida: item.terminalPos?.cargaManualPermitida,
        decimalesPorMoneda: this.decimalesPorMoneda,
        titulo: 'Completar venta con tarjeta',
        segundos: 120,
        // Para la captura por foto: el token cuelga de la caja del pendiente, no de la caja
        // abierta ahora --esta pantalla se usa tambien para pendientes de otro turno.
        // Esta lista viene del CENTRAL, que devuelve `caja { id }`; el escalar `cajaId` es lo
        // que devuelve el filial. Se aceptan los dos (ver el comentario de VentaTarjeta).
        cajaId: item.caja?.id ?? item.cajaId,
        usuarioId: this.mainService.usuarioActual?.id,
      },
      disableClose: false
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(() => this.onGetData());
  }
}
