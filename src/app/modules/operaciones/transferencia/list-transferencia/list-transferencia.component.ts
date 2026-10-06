import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PageInfo } from "../../../../app.component";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { EditTransferenciaComponent } from "../edit-transferencia/edit-transferencia.component";
import {
  EtapaTransferencia,
  Transferencia,
  TransferenciaEstado,
  TransferenciaInput,
  TransferenciaView,
} from "../transferencia.model";
import { TabData, TabService } from "./../../../../layouts/tab/tab.service";
import { ROLES } from '../../../personas/roles/roles.enum';
import { OrigenNotaRemision } from '../../../financiero/nota-remision/nota-remision.model';
import { NotaRemisionService } from '../../../financiero/nota-remision/nota-remision.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { AddNotaRemisionDialogComponent } from '../../../financiero/nota-remision/add-nota-remision-dialog/add-nota-remision-dialog.component';
import { MainService } from "./../../../../main.service";
import { CargandoDialogService } from "./../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { TransferenciaService } from "./../transferencia.service";
import { MatDialog } from "@angular/material/dialog";
import { interval } from "rxjs";
import { PROPAGAR_ERROR_DE_RED } from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "./../../../../notificacion-snackbar.service";
import { SelectionModel } from "@angular/cdk/collections";
import { RutaHojaComponent } from "../ruta-hoja/ruta-hoja.component";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { erroresDeRechazo } from "../../../../commons/core/utils/graphqlErrorUtils";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { UsuarioSearchGQL } from "../../../personas/usuarios/graphql/usuarioSearch";
import { TipoEntidad } from "./../../../../generics/tipo-entidad.enum";
import {
  QrCodeComponent,
  QrData,
} from "./../../../../shared/qr-code/qr-code.component";
import { Usuario } from "../../../personas/usuarios/usuario.model";

@UntilDestroy()
@Component({
  selector: "app-list-transferencia",
  templateUrl: "./list-transferencia.component.html",
  styleUrls: ["./list-transferencia.component.scss"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListTransferenciaComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  titulo = "Lista de Transferencias";

  dataSource = new MatTableDataSource<TransferenciaView>([]);
  selection = new SelectionModel<TransferenciaView>(true, []);

  selectedTransferencia: Transferencia;
  expandedTransferencia: Transferencia;

  idControl = new FormControl();
  sucOrigenControl = new FormControl();
  sucDestinoControl = new FormControl();
  estadoControl = new FormControl<TransferenciaEstado[]>([]);
  etapaControl = new FormControl();
  ultimoResponsableControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;
  sucursalList: Sucursal[];
  sucursalIdlist: Number[];
  estadoList = Object.values(TransferenciaEstado);
  etapaList = Object.values(EtapaTransferencia);
  estadoTriggerLabel = "";
  selectedUltimoResponsable: Usuario;
  today = new Date();

  displayedColumns = [
    "select",
    "id",
    "origen",
    "destino",
    "estado",
    "etapa",
    "responsable",
    "fecha",
    "tipo",
    "acciones",
  ];

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  selectedPageInfo: PageInfo<Transferencia>;

  constructor(
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoDialogService,
    private tabService: TabService,
    public mainService: MainService,
    private sucursalService: SucursalService,
    private matDialog: MatDialog,
    private notificacionService: NotificacionSnackbarService,
    private usuarioSearch: UsuarioSearchGQL,
    private notaRemisionService: NotaRemisionService,
    private impresionService: ImpresionService,
    private dialogosService: DialogosService
  ) { }

  /** Rol para emitir la nota de remisión del traslado; se calcula una vez, no en el HTML. */
  puedeEmitirNotaRemision = false;

  /** Notas ya emitidas por transferencia: con una cargada, el menú dice «Imprimir». */
  notaRemisionPorTransferencia: { [transferenciaId: number]: any } = {};

  /**
   * Qué transferencias de la página ya tienen nota, en una sola consulta al cargar la lista. Sin esto
   * el menú decía «Nota de remisión» también en las que ya la tenían, y el usuario se enteraba recién
   * al hacer clic, cuando en vez del alta se le abría la impresión.
   */
  private cargarNotasRemision(): void {
    const ids = (this.dataSource.data ?? []).map(t => t.id).filter(id => id != null);
    if (!this.puedeEmitirNotaRemision || !ids.length) {
      this.notaRemisionPorTransferencia = {};
      return;
    }
    this.notaRemisionService.onGetPorTransferencias(ids)
      .pipe(untilDestroyed(this))
      .subscribe(notas => {
        const porTransferencia: { [transferenciaId: number]: any } = {};
        (notas ?? []).forEach(n => { if (n?.transferenciaId) porTransferencia[n.transferenciaId] = n; });
        this.notaRemisionPorTransferencia = porTransferencia;
      });
  }

  private imprimirNotaRemision(nota: any): void {
    const numero = nota?.numeroNotaRemision
      ? `001-001-${String(nota.numeroNotaRemision).padStart(7, '0')}` : '';
    this.impresionService.imprimir(
      numero ? `KuDE-NR-${numero}` : 'KuDE-NR',
      () => this.notaRemisionService.onImprimir(nota.id, nota.sucursalId),
      true
    );
  }

  ngOnInit(): void {
    this.puedeEmitirNotaRemision = this.mainService.tieneAlgunRol([ROLES.FACTURACION_EMITIR, ROLES.ADMIN]);

    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.pageSize = this.paginator.pageSizeOptions[1];
      this.onFilter();
    }, 0);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl,
    });

    this.sucursalList = [];
    this.sucursalIdlist = [];

    this.onGetTransferencias();
    this.sucursalService.onGetAllSucursales(true, PROPAGAR_ERROR_DE_RED,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }).subscribe({
      next: (res) => {
        // Con null (error del servidor) res.filter lanzaba TypeError (#390).
        this.sucursalList = (res ?? []).filter((s) => {
          if (s.id != 0) {
            this.sucursalIdlist.push(s.id);
            return s;
          }
        });
      },
      error: () => this.notificacionService.openWarn('No se pudieron cargar las sucursales para el filtro.', 5)
    });

    interval(300000).pipe(untilDestroyed(this)).subscribe(() => {
      this.onFilter();
    });
  }

  onGetTransferencias() {
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
    this.onFilter();
  }

  onFilter() {
    if (this.fechaFinControl.value == null)
      this.fechaFinControl.setValue(this.today);
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.fechaFinControl.value.getDate() - 7);
    if (this.fechaInicioControl.value == null)
      this.fechaInicioControl.setValue(unaSemanaAtras);
    if (this.idControl.value == null) {
      let fechaInicio: Date = this.fechaInicioControl.value;
      let fechaFin: Date = this.fechaFinControl.value;
      fechaInicio.setHours(0, 0, 0);
      fechaFin.setHours(23, 59, 59);
      this.transferenciaService
        .onGetTransferenciasWithFilters(
          this.sucOrigenControl.value?.id,
          this.sucDestinoControl.value?.id,
          this.estadoControl.value,
          null,
          this.etapaControl.value,
          null,
          null,
          this.selectedUltimoResponsable?.id,
          dateToString(fechaInicio),
          dateToString(fechaFin),
          this.pageIndex,
          this.pageSize,
          true,
          PROPAGAR_ERROR_DE_RED,
          { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }
        )
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res: PageInfo<Transferencia>) => {
            if (res == null) { this.avisarListaNoCargada(); return; }
            this.selectedPageInfo = res;
            this.dataSource.data = res.getContent.map((t) => this.toView(t));
            this.reseleccionarPendientesDeRuta();
            this.cargarNotasRemision();
          },
          error: () => this.avisarListaNoCargada()
        });
    } else {
      this.transferenciaService
        .onGetTransferencia(this.idControl.value)
        .subscribe({
          next: (res) => {
            if (res == null) {
              this.notificacionService.openWarn('No se encontró la transferencia o no se pudo consultar.', 5);
              return;
            }
            this.dataSource.data = [this.toView(res)];
            this.cargarNotasRemision();
          },
          error: () => this.avisarListaNoCargada()
        });
    }
  }

  private avisarListaNoCargada() {
    this.notificacionService.openWarn('No se pudieron cargar las transferencias: el servidor no responde.', 5);
  }

  onResetFiltro() {
    this.idControl.setValue(null);
    this.sucOrigenControl.setValue(null);
    this.sucDestinoControl.setValue(null);
    this.estadoControl.setValue([]);
    this.onEstadoSelectionChange();
    this.etapaControl.setValue(null);
    this.onClearUltimoResponsable();
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
  }

  // Se recalcula solo al cambiar la seleccion (no en cada change detection cycle,
  // por eso no se llama desde el HTML).
  onEstadoSelectionChange() {
    const estados = this.estadoControl.value ?? [];
    this.estadoTriggerLabel = estados
      .map((e) => e.replace(/_/g, " "))
      .join(", ");
  }

  /**
   * Mismo criterio que usa el filtro del backend: gana el responsable de la etapa
   * mas avanzada que ya tiene uno asignado. Se resuelve aca y no en el template
   * porque el HTML no puede llamar funciones en cada ciclo de deteccion de cambios.
   */
  private toView(transferencia: Transferencia): TransferenciaView {
    const ultimo =
      transferencia?.usuarioRecepcion ??
      transferencia?.usuarioTransporte ??
      transferencia?.usuarioPreparacion ??
      transferencia?.usuarioPreTransferencia;
    return Object.assign({}, transferencia, {
      ultimoResponsable: ultimo?.nickname ?? "-",
    }) as TransferenciaView;
  }

  /**
   * El backend filtra por el responsable de la etapa mas avanzada que ya tiene uno
   * asignado, asi que este control no matchea contra las etapas anteriores.
   */
  onBuscarUltimoResponsable() {
    let data: SearchListtDialogData = {
      titulo: "Buscar usuario",
      query: this.usuarioSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nickname", nombre: "Nombre", width: "70%" },
      ],
      search: true,
    };
    this.matDialog
      .open(SearchListDialogComponent, {
        data,
        height: "80%",
        width: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Usuario) => {
        if (res != null) {
          this.selectedUltimoResponsable = res;
          this.ultimoResponsableControl.setValue(res.id + " - " + res.nickname);
        }
      });
  }

  onClearUltimoResponsable() {
    this.selectedUltimoResponsable = null;
    this.ultimoResponsableControl.setValue(null);
  }

  onRowClick(transferencia: Transferencia, index) {
    // this.expandedTransferencia = transferencia;
    // this.cargandoService.openDialog();
    // if (transferencia?.transferenciaItemList == null) {
    //   this.transferenciaService
    //     .onGetTransferencia(transferencia.id)
    //     .pipe(untilDestroyed(this))
    //     .subscribe((res) => {
    //       this.cargandoService.closeDialog();
    //       if (res != null) {
    //         this.selectedTransferencia = res;
    //         this.dataSource.data = updateDataSource(
    //           this.dataSource.data,
    //           res,
    //           index
    //         );
    //       }
    //     });
    // } else {
    //   this.cargandoService.closeDialog();
    // }
  }

  onEdit(transferencia: Transferencia, index) {
    this.tabService.addTab(
      new Tab(
        EditTransferenciaComponent,
        "Transf. " + transferencia.id,
        new TabData(transferencia.id),
        ListTransferenciaComponent
      )
    );
  }

  onDelete(transferencia: Transferencia, index) {
    // Primero cargar los detalles completos de la transferencia para verificar si tiene productos
    const { requestId } = this.cargandoService.openDialog();

    this.transferenciaService
      .onGetTransferencia(transferencia.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (transferenciaCompleta) => {
          this.cargandoService.closeDialog(requestId);
          // Sin la transferencia completa no se sabe si tiene productos: no se borra (#390).
          if (transferenciaCompleta == null) {
            this.notificacionService.openWarn('No se pudo verificar la transferencia: no se eliminó.', 5);
            return;
          }

          // Verificar si la transferencia tiene productos
          if (transferenciaCompleta?.transferenciaItemList && transferenciaCompleta.transferenciaItemList.length > 0) {
            this.notificacionService.notification$.next({
              texto: `No se puede eliminar la transferencia. Contiene ${transferenciaCompleta.transferenciaItemList.length} producto(s).`,
              color: NotificacionColor.warn,
              duracion: 4
            });
            return;
          }

          // Si no tiene productos, proceder con la eliminación
          this.transferenciaService
            .onDeleteTransferencia(transferencia.id)
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res) {
                this.dataSource.data = updateDataSource(
                  this.dataSource.data,
                  null,
                  index
                );
                this.notificacionService.notification$.next({
                  texto: 'Transferencia eliminada correctamente',
                  color: NotificacionColor.success,
                  duracion: 3
                });
              }
            });
        },
        error: (error) => {
          this.cargandoService.closeDialog(requestId);
          this.notificacionService.notification$.next({
            texto: 'Error al verificar los detalles de la transferencia',
            color: NotificacionColor.danger,
            duracion: 4
          });
        }
      });
  }

  onAdd() {
    this.tabService.addTab(
      new Tab(
        EditTransferenciaComponent,
        "Nueva Transferencia",
        null,
        ListTransferenciaComponent
      )
    );
  }

  onImprimir(id) {
    this.transferenciaService.onImprimirTransferencia(id);
  }

  onQrClick(transferencia: TransferenciaView) {
    let codigo: QrData = {
      sucursalId: this.mainService.sucursalActual.id,
      tipoEntidad: TipoEntidad.TRANSFERENCIA,
      idOrigen: transferencia.id,
      idCentral: transferencia.id,
      componentToOpen: "EditTransferenciaComponent",
    };
    let qrDialogRef = this.matDialog.open(QrCodeComponent, {
      data: {
        codigo: codigo,
        nombre: "Transferencia",
        imprimir: true,
      },
    });

    // Cierra el diálogo solo cuando el móvil escanea este QR. El aviso llega
    // por subscription desde el central; se filtra por transferencia y
    // sucursal porque el canal es único para todos los desktops conectados.
    let escaneoSub = this.transferenciaService
      .qrEscaneadoSub()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (
          res != null &&
          +res.transferenciaId == +transferencia.id &&
          +res.sucursalId == +this.mainService.sucursalActual.id
        ) {
          qrDialogRef.close();
        }
      });

    qrDialogRef.afterClosed().subscribe((res) => {
      escaneoSub.unsubscribe();
      if (res == "imprimir") {
        this.onImprimir(transferencia.id);
      }
    });
  }

  isAllSelected() {
    const numSelected = this.selection.selected?.length;
    const numRows = this.dataSource.data?.filter(t => t.hojaRuta == null).length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => {
        if (row.hojaRuta == null) this.selection.select(row)
      });
  }

  /**
   * Hoja de ruta ya creada que no llegó a asignarse a todas las transferencias elegidas. Sin esto no había
   * forma de reintentar con la misma hoja: el diálogo siempre crea una nueva, y la primera quedaba huérfana (#390).
   */
  private rutaPendiente: { hoja: any; ids: number[] } | null = null;

  onAsignarRuta() {
    if (this.selection.selected.length === 0) {
      this.notificacionService.openWarn('Debe seleccionar al menos una transferencia');
      return;
    }
    // La hoja pendiente se ofrece solo si entre las seleccionadas hay alguna de las que le quedaron sin asignar.
    const pendiente = this.rutaPendiente;
    const hayPendientes = pendiente != null
      && this.selection.selected.some((t) => pendiente.ids.some((id) => id == t.id));
    if (!hayPendientes) {
      this.abrirNuevaHojaDeRuta();
      return;
    }
    this.dialogosService.confirm(
      'Hoja de ruta pendiente',
      `La hoja #${pendiente.hoja.id} no llegó a asignarse a todas las transferencias. ¿Asignar las seleccionadas a esa misma hoja?`,
      'Con «No» se crea una hoja nueva.',
      null, true, 'Sí, usar la misma', 'No, crear otra',
    ).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res === true) {
        this.asignarHojaALasSeleccionadas(pendiente.hoja);
      } else if (res === false) {
        this.rutaPendiente = null;
        this.abrirNuevaHojaDeRuta();
      }
    });
  }

  private abrirNuevaHojaDeRuta() {
    this.matDialog.open(RutaHojaComponent, {
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    }).afterClosed().subscribe((res) => {
      if (res) this.asignarHojaALasSeleccionadas(res);
    });
  }

  /**
   * Asigna la hoja a las transferencias seleccionadas, una por una. Repetir una asignación es inocuo (actualiza
   * la transferencia con la misma hoja); lo que no conviene es seguir intentando cuando el servidor dejó de
   * responder: cada una esperaría su corte. Al primer «sin respuesta» se corta, y lo que falta queda
   * seleccionado para reintentar con la misma hoja.
   */
  private async asignarHojaALasSeleccionadas(hoja: any) {
    const seleccionadas = [...this.selection.selected];
    const { requestId } = this.cargandoService.openDialog();
    let count = 0;
    const rechazadas: number[] = [];
    const noIntentadas: number[] = [];
    let sinConfirmar: number | null = null;
    try {
      for (let transferencia of seleccionadas) {
        if (sinConfirmar != null) {
          noIntentadas.push(transferencia.id);
          continue;
        }
        const input = new TransferenciaInput();
        input.id = transferencia.id;
        input.sucursalOrigenId = transferencia.sucursalOrigen?.id;
        input.sucursalDestinoId = transferencia.sucursalDestino?.id;
        input.estado = transferencia.estado;
        input.tipo = transferencia.tipo;
        input.etapa = transferencia.etapa;
        // saveTransferencia persiste con merge: todo campo ausente se guarda como
        // null, por eso se reenvian los datos que ya tiene la transferencia.
        input.observacion = transferencia.observacion;
        input.isOrigen = transferencia.isOrigen;
        input.isDestino = transferencia.isDestino;
        input.hojaRutaId = hoja.id;

        const resultado = await new Promise<'ok' | 'rechazada' | 'sin-confirmar'>((resolve) => {
          this.transferenciaService.onSaveTransferencia(input).subscribe({
            next: (result) => resolve(result != null ? 'ok' : 'rechazada'),
            error: (err) => {
              console.error('Error al guardar transferencia:', err);
              resolve(erroresDeRechazo(err) != null ? 'rechazada' : 'sin-confirmar');
            }
          });
        });
        if (resultado === 'ok') count++;
        else if (resultado === 'rechazada') rechazadas.push(transferencia.id);
        else sinConfirmar = transferencia.id;
      }
      // Una rechazada no queda pendiente: repetirla daría el mismo rechazo, y la hoja quedaría ofrecida para siempre.
      const pendientes = [...(sinConfirmar != null ? [sinConfirmar] : []), ...noIntentadas];
      this.rutaPendiente = pendientes.length > 0 ? { hoja, ids: pendientes } : null;
      if (pendientes.length === 0 && rechazadas.length === 0) {
        this.notificacionService.openSucess('Ruta asignada a ' + count + ' transferencias.');
      } else {
        const partes = [`Hoja #${hoja.id}: asignada a ${count} transferencias.`];
        if (sinConfirmar != null) partes.push(`Sin confirmar: ${sinConfirmar} (pudo haberse asignado).`);
        if (noIntentadas.length > 0) partes.push(`Sin intentar: ${noIntentadas.join(', ')}.`);
        if (rechazadas.length > 0) partes.push(`No se pudo asignar a: ${rechazadas.join(', ')}.`);
        if (pendientes.length > 0) {
          partes.push('Quedaron seleccionadas: volvé a asignar para usar la misma hoja (repetir es seguro).');
        }
        this.notificacionService.openWarn(partes.join(' '), 15);
      }
    } catch (error) {
      console.error('Error en asignación de ruta:', error);
      this.notificacionService.openWarn('Ocurrió un error durante la asignación');
    } finally {
      this.cargandoService.closeDialog(requestId);
      this.selection.clear();
      this.onFilter();
    }
  }

  /** Tras releer, vuelve a marcar las transferencias que quedaron sin asignar a la hoja pendiente. */
  private reseleccionarPendientesDeRuta() {
    const pendiente = this.rutaPendiente;
    if (pendiente == null) return;
    // La que al releer ya trae hoja se asignó (era la «sin confirmar»): deja de estar pendiente.
    const yaAsignadas = this.dataSource.data.filter((t) => t.hojaRuta != null).map((t) => t.id);
    pendiente.ids = pendiente.ids.filter((id) => !yaAsignadas.some((a) => a == id));
    if (pendiente.ids.length === 0) {
      this.rutaPendiente = null;
      return;
    }
    // Cada relectura crea filas nuevas: se sacan las anteriores de la selección para no duplicarlas.
    const viejas = this.selection.selected.filter((t) => pendiente.ids.some((id) => id == t.id));
    if (viejas.length > 0) this.selection.deselect(...viejas);
    const filas = this.dataSource.data.filter((t) => t.hojaRuta == null && pendiente.ids.some((id) => id == t.id));
    if (filas.length > 0) this.selection.select(...filas);
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFilter();
  }

  /**
   * Abre la nota de remisión de esta transferencia. El borrador (receptor, salida, entrega,
   * vehículo, chofer e ítems) lo arma el central; acá solo se pasa el origen y la referencia.
   *
   * Si la transferencia ya tiene una nota activa, se avisa en vez de emitir una segunda: SIFEN
   * aceptaría las dos y quedaría un traslado amparado por duplicado.
   */
  onNotaRemision(transferencia: any): void {
    // La nota la emite la sucursal de origen: es la que despacha.
    const sucursalId = transferencia.sucursalOrigen?.id ?? this.mainService.sucursalActual?.id;
    this.notaRemisionService.onGetPorTransferencia(transferencia.id, sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe(notaExistente => {
        if (notaExistente?.id) {
          // Ya emitida: el ítem del menú dice «Imprimir», así que acá se imprime.
          this.notaRemisionPorTransferencia[transferencia.id] = notaExistente;
          this.imprimirNotaRemision(notaExistente);
          return;
        }
        this.matDialog.open(AddNotaRemisionDialogComponent, {
          width: '95%',
          maxWidth: '1200px',
          data: {
            origen: OrigenNotaRemision.TRANSFERENCIA,
            referenciaId: transferencia.id,
            sucursalId
          }
        }).afterClosed().pipe(untilDestroyed(this)).subscribe(guardada => {
          // El diálogo devuelve la nota si llegó a guardarse (aunque el envío a SIFEN haya fallado):
          // desde ya existe, así que el menú pasa a «Imprimir».
          if (guardada?.id) {
            this.notaRemisionPorTransferencia = {
              ...this.notaRemisionPorTransferencia,
              [transferencia.id]: guardada
            };
          }
        });
      });
  }
}
