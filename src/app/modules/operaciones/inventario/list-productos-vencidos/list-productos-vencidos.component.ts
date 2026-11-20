import { Component, ElementRef, Input, OnInit, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { forkJoin, Observable, of } from "rxjs";
import { catchError, finalize, map } from "rxjs/operators";
import { PaginaCentral, PaginacionLista } from "../../../../shared/components/paginacion/paginacion-lista";

import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { UsuarioSearchGQL } from "../../../personas/usuarios/graphql/usuarioSearch";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { ProductoVencidoView, FuenteVerdadVencimiento } from "../inventario.model";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ProductosVencidosGQL } from "../graphql/productos-vencidos.gql";
import { ReporteProductosVencidosGQL } from "../graphql/reporteProductosVencidos";
import { ReporteService } from "../../../reportes/reporte.service";
import { ReportesComponent } from "../../../reportes/reportes/reportes.component";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { EditTransferenciaComponent } from "../../transferencia/edit-transferencia/edit-transferencia.component";
import { TabData } from "../../../../layouts/tab/tab.service";
import { Transferencia, TransferenciaEstado, TipoTransferencia, EtapaTransferencia, TransferenciaItem } from "../../transferencia/transferencia.model";
import { TransferenciaService } from "../../transferencia/transferencia.service";
import { SeleccionarSucursalDialogComponent } from "../../transferencia/seleccionar-sucursal-dialog/seleccionar-sucursal-dialog.component";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Presentacion } from "../../../productos/presentacion/presentacion.model";

export interface ProductosVencidosFilters {
  startDate?: string;
  endDate?: string;
  sucursalIdList?: number[];
  usuarioIdList?: number[];
  productoIdList?: number[];
  fuenteVerdadList?: FuenteVerdadVencimiento[];
  soloRealmenteVencidos?: boolean;
  page: number;
  size: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-productos-vencidos",
  templateUrl: "./list-productos-vencidos.component.html",
  styleUrls: ["./list-productos-vencidos.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListProductosVencidosComponent implements OnInit, OnDestroy {
  @Input() data: Tab;

  @ViewChild("buscarUsuarioInput", { static: true }) buscadorUsuarioInput: ElementRef;
  @ViewChild("buscadorInput", { static: true }) buscadorInput: ElementRef;
  expandedProductoVencido: ProductoVencidoView;
  fechaFormGroup: FormGroup;
  sucursalControl = new FormControl();
  buscarUsuarioControl = new FormControl();
  buscarProductoControl = new FormControl();
  soloRealmenteVencidosControl = new FormControl(false);
  fuenteVerdadControl = new FormControl<FuenteVerdadVencimiento[]>([]);
  readonly fuenteVerdadOpciones: { value: FuenteVerdadVencimiento; label: string }[] = [
    { value: 'INVENTARIO', label: 'Inventario' },
    { value: 'COMPRA', label: 'Compra' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' },
  ];
  sucursalList: Sucursal[] = [];
  selectedUsuario: Usuario | null = null;
  selectedProducto: Producto | null = null;
  /** Paginada en el central (#772): gana la última página pedida; si falla una página vuelve a la anterior. */
  pag: PaginacionLista<ProductoVencidoView> = new PaginacionLista<ProductoVencidoView>({
    cargar: (page, size) => this.loadProductosVencidos({ ...this.filtros(), page, size }),
    alCargar: () => this.cdRef.detectChanges(),
    alFallar: () => this.cdRef.detectChanges(),
  });

  private isDialogOpen = false;
  readonly today = new Date();
  disableRetiroButton = true;

  readonly displayedColumns: string[] = [
    "descripcion",
    "codigoBarras",
    "cantidadSistema",
    "vencimiento",
    "diasVencimiento",
    "fuenteVerdad",
    "sucursal",
    "sector",
    "zona"
  ];

  constructor(
    private sucursalService: SucursalService,
    private tabService: TabService,
    private usuarioSearchGQL: UsuarioSearchGQL,
    private productosVencidosGQL: ProductosVencidosGQL,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private mainService: MainService,
    private notificacion: NotificacionSnackbarService,
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoDialogService,
    private genericCrudService: GenericCrudService,
    private reporteProductosVencidosGQL: ReporteProductosVencidosGQL,
    private reporteService: ReporteService
  ) {
    this.fechaFormGroup = new FormGroup({
      inicio: new FormControl(),
      fin: new FormControl(),
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.fechaFormGroup.get("inicio")?.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((val) => {
        this.inicioMinDate = val || null;
      });
    this.inicioMinDate = this.fechaFormGroup.get("inicio")?.value || null;

    this.sucursalControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((sucursales: Sucursal[] | null) => {
        this.disableRetiroButton = !sucursales || sucursales.length !== 1;
        this.cdRef.detectChanges();
      });
    const sucursalesIniciales: Sucursal[] | null = this.sucursalControl.value;
    this.disableRetiroButton = !sucursalesIniciales || sucursalesIniciales.length !== 1;
  }

  inicioMinDate: Date | null = null;

  ngOnDestroy(): void {}

  trackBySucursalId(index: number, item: Sucursal): number {
    return item.id;
  }

  trackByItemId(index: number, item: ProductoVencidoView): number {
    return item.id || index;
  }

  onRowClick(row: ProductoVencidoView): void {
    this.expandedProductoVencido = this.expandedProductoVencido === row ? null : row;
  }

  private loadInitialData(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    this.fechaFormGroup.get("inicio")?.setValue(start);
    this.fechaFormGroup.get("fin")?.setValue(end);
    this.pag.filtrar();
    this.loadSucursales();
  }

  private loadSucursales(): void {
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        this.sucursalList = data;
        this.cdRef.detectChanges();
      });
  }

  /** Una página; `null` si no llegó (ya avisado). */
  private loadProductosVencidos(filters: ProductosVencidosFilters): Observable<PaginaCentral<ProductoVencidoView> | null> {
    const { requestId } = this.cargandoService.openDialog(
      false,
      "Buscando..."
    );
    return this.productosVencidosGQL.fetch(filters, {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
      context: {
        // Forzar la consulta al servidor CENTRAL (clientName "servidor").
        // Sin esto, en modo local (isLocal=true) el split de Apollo la ruteaba
        // al filial, que no tiene el schema de productosVencidos y devolvía
        // "Query failed to validate". El central sí lo expone; así se comporta
        // igual que en modo solo-cloud.
        clientName: 'servidor',
      },
    }).pipe(
      map((result: any) => {
        if (result.errors?.length) {
          console.error('Error en productosVencidos:', result.errors);
          this.notificacion.openAlgoSalioMal(result.errors[0]?.message || 'Error al buscar productos vencidos');
          return null;
        }
        if (!result?.data?.productosVencidos) {
          console.error('Estructura de respuesta inválida');
          return null;
        }
        return result.data.productosVencidos;
      }),
      catchError(error => {
        // Ej: servidor offline.
        console.error('Error en productosVencidos:', error);
        this.notificacion.openAlgoSalioMal('Error al buscar productos vencidos');
        return of(null);
      }),
      // Cierra el spinner en éxito, error o cancelación (al pedir otra página o filtro).
      finalize(() => this.cargandoService.closeDialog(requestId))
    );
  }

  onFiltrar(): void {
    this.pag.filtrar();
  }

  onResetFiltro(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    this.fechaFormGroup.get("inicio")?.setValue(start);
    this.fechaFormGroup.get("fin")?.setValue(end);
    this.sucursalControl.setValue(null);
    this.buscarProductoControl.setValue("");
    this.buscarUsuarioControl.setValue("");
    this.soloRealmenteVencidosControl.setValue(false);
    this.fuenteVerdadControl.setValue([]);
    this.selectedProducto = null;
    this.selectedUsuario = null;
    this.onFiltrar();
  }

  onGenerarPdf(): void {
    // El reporte trae TODO lo que matchea el filtro, no la pagina visible: por eso
    // se mandan los mismos filtros que la lista pero sin page/size (filtros()).
    this.genericCrudService.onCustomQuery(this.reporteProductosVencidosGQL, {
      startDate: this.getStartDate(),
      endDate: this.getEndDate(),
      sucursalIdList: this.sucursalIdList(),
      usuarioIdList: this.usuarioIdList(),
      productoIdList: this.productoIdList(),
      fuenteVerdadList: this.fuenteVerdadList(),
      soloRealmenteVencidos: this.soloRealmenteVencidosControl.value,
      usuarioResponsableId: this.mainService?.usuarioActual?.id,
    })
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        // El backend devuelve null cuando el filtro no dio resultados.
        if (res == null) {
          this.notificacion.openWarn('No hay productos vencidos para los filtros seleccionados');
          return;
        }
        this.reporteService.onAdd('Productos Vencidos', res);
        this.tabService.addTab(
          new Tab(ReportesComponent, 'Reportes', null, ListProductosVencidosComponent)
        );
      });
  }

  onRetirarProductos(): void {
    const items = this.pag.items;
    if (items.length === 0) {
      this.notificacion.openWarn('No hay productos en la página actual');
      return;
    }

    const sucursalesSeleccionadas: Sucursal[] = this.sucursalControl.value || [];
    if (sucursalesSeleccionadas.length !== 1) {
      this.notificacion.openWarn('Debe seleccionar una sucursal para realizar el retiro');
      return;
    }
    const sucursalOrigenSeleccionada: Sucursal = sucursalesSeleccionadas[0];

    this.isDialogOpen = true;
    this.dialog.open(SeleccionarSucursalDialogComponent, {
      width: '80%',
      height: '70%',
      disableClose: false,
      data: {
        sucursalOrigen: sucursalOrigenSeleccionada,
        sucursalDestino: null,
      },
    }).afterClosed().subscribe((res) => {
      this.isDialogOpen = false;
      if (!res?.sucursalDestino) return;

      const transferencia = new Transferencia();
      transferencia.sucursalOrigen = res.sucursalOrigen as Sucursal;
      transferencia.sucursalDestino = res.sucursalDestino as Sucursal;
      transferencia.tipo = TipoTransferencia.MANUAL;
      transferencia.estado = TransferenciaEstado.ABIERTA;
      transferencia.etapa = EtapaTransferencia.PRE_TRANSFERENCIA_CREACION;
      transferencia.usuarioPreTransferencia = this.mainService?.usuarioActual;

      this.transferenciaService.onSaveTransferencia(transferencia.toInput())
        .pipe(untilDestroyed(this))
        .subscribe((t) => {
          if (!t?.id) return;

          const ops = items.map((it) => {
            const trItem = new TransferenciaItem();
            trItem.transferencia = t;
            const presentacion = new Presentacion();
            presentacion.id = it.presentacionId;
            presentacion.cantidad = it.presentacionCantidad;
            trItem.presentacionPreTransferencia = presentacion;
            trItem.cantidadPreTransferencia = it.cantidad;
            trItem.vencimientoPreTransferencia = it.vencimiento as any;
            trItem.poseeVencimiento = !!it.vencimiento;
            trItem.activo = true;
            trItem.usuario = this.mainService?.usuarioActual;
            // Resultado por ítem: forkJoin cortaría en el primer error sin decir cuántos entraron.
            // Cada ítem va sin «Guardado con éxito» y su error lo avisa onSaveCustom.
            return this.transferenciaService.onSaveTransferenciaItem(trItem.toInput(), undefined, true, { avisarExito: false }).pipe(
              map(() => true),
              catchError(() => of(false))
            );
          });

          if (ops.length === 0) {
            this.abrirTransferenciaTab(t.id);
            return;
          }

          forkJoin(ops).pipe(untilDestroyed(this)).subscribe((resultados) => {
            const agregados = resultados.filter((ok) => ok).length;
            if (agregados > 0) {
              this.actualizarFiltrosDespuesRetiro(res.sucursalOrigen as Sucursal, res.sucursalDestino as Sucursal);
              this.pag.filtrar();
            }
            if (agregados === ops.length) {
              this.notificacion.openSucess(`Transferencia ${t.id} creada exitosamente. Los productos han sido agregados.`);
            } else if (agregados > 0) {
              this.notificacion.openWarn(
                `Transferencia ${t.id} creada: ${agregados} de ${ops.length} productos agregados; los demás dieron error.`, 8);
            } else {
              // El motivo ya lo dio onSaveCustom; esto dice lo que el error no dice: la cabecera quedó vacía.
              this.notificacion.openWarn(`Transferencia ${t.id} creada sin productos: ninguno se pudo agregar.`, 8);
            }
            // La cabecera ya existe: se abre igual para completar o descartar a mano.
            this.abrirTransferenciaTab(t.id);
          });
        });
    });
  }

  private actualizarFiltrosDespuesRetiro(sucursalOrigen: Sucursal, sucursalDestino: Sucursal): void {
    const sucursalesActuales: Sucursal[] = this.sucursalControl.value || [];
    const destinoYaIncluida = sucursalesActuales.some(s => s.id === sucursalDestino.id);
    if (!destinoYaIncluida) {
      this.sucursalControl.setValue([...sucursalesActuales, sucursalDestino]);
    }
  }

  private abrirTransferenciaTab(id: number): void {
    this.tabService.addTab(new Tab(
      EditTransferenciaComponent,
      `Transferencia ${id}`,
      new TabData(id, { id }),
      null
    ));
  }

  onSeleccionarTodasSucursales(): void {
    this.sucursalControl.setValue([...this.sucursalList]);
  }

  onBuscarProducto(): void {
    if (this.isDialogOpen) return;

    this.isDialogOpen = true;
    const texto = this.buscarProductoControl.value?.trim() || null;
    const data: PdvSearchProductoData = {
      texto,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
    };

    const dialogRef = this.dialog.open(PdvSearchProductoDialogComponent, {
      data,
      height: "80%",
    });

    dialogRef.afterClosed().subscribe((result: PdvSearchProductoResponseData) => {
      this.isDialogOpen = false;
      if (result?.producto) {
        this.selectedProducto = result.producto;
        this.buscarProductoControl.setValue(
          `${result.producto.descripcion} - ${result.producto.codigoPrincipal}`
        );
        this.pag.filtrar();
      }
    });
  }

  onClearProducto(): void {
    this.selectedProducto = null;
    this.buscarProductoControl.setValue("");
    this.pag.filtrar();
  }

  onBuscarUsuario(): void {
    if (this.isDialogOpen) return;

    this.isDialogOpen = true;
    const data: SearchListtDialogData = {
      titulo: "Buscar Usuario",
      query: this.usuarioSearchGQL,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nickname", nombre: "Nombre", width: "70%" },
      ],
      texto: this.buscarUsuarioControl.value,
      search: true,
      inicialSearch: true,
    };

    const dialogRef = this.dialog.open(SearchListDialogComponent, {
      data,
      height: "80%",
      width: "80%",
    });

    dialogRef.afterClosed().subscribe((result: Usuario) => {
      this.isDialogOpen = false;
      if (result) {
        this.selectedUsuario = result;
        this.buscarUsuarioControl.setValue(
          `${result.persona.nombre} ${result.persona.apodo}`
        );
        this.pag.filtrar();
      }
    });
  }

  onClearUsuario(): void {
    this.selectedUsuario = null;
    this.buscarUsuarioControl.setValue("");
    this.pag.filtrar();
  }

  /** Los filtros de la pantalla, sin página (también los usa el PDF). */
  private filtros(): Omit<ProductosVencidosFilters, 'page' | 'size'> {
    return {
      startDate: this.getStartDate(),
      endDate: this.getEndDate(),
      sucursalIdList: this.sucursalIdList(),
      usuarioIdList: this.usuarioIdList(),
      productoIdList: this.productoIdList(),
      fuenteVerdadList: this.fuenteVerdadList(),
      soloRealmenteVencidos: this.soloRealmenteVencidosControl.value,
    };
  }

  private getStartDate(): string | null {
    const fechaInicio = this.fechaFormGroup.get("inicio")?.value;
    if (fechaInicio) {
      const fecha = new Date(fechaInicio);
      fecha.setHours(0, 0, 0, 0);
      return dateToString(fecha);
    }
    return null;
  }

  private getEndDate(): string | null {
    const fechaFin = this.fechaFormGroup.get("fin")?.value;
    if (fechaFin) {
      const fecha = new Date(fechaFin);
      fecha.setHours(23, 59, 59, 999);
      return dateToString(fecha);
    }
    return null;
  }

  private sucursalIdList(): number[] | null {
    const sucursales: Sucursal[] | null = this.sucursalControl.value;
    if (!sucursales?.length) {
      return null;
    }
    const ids = sucursales
      .map((sucursal) => Number(sucursal?.id))
      .filter((id) => !Number.isNaN(id));
    return ids.length > 0 ? ids : null;
  }

  private usuarioIdList(): number[] | null {
    return this.selectedUsuario ? [this.selectedUsuario.id] : null;
  }

  private productoIdList(): number[] | null {
    const productoId = this.selectedProducto?.id;
    return productoId != null ? [productoId] : null;
  }

  private fuenteVerdadList(): FuenteVerdadVencimiento[] | null {
    const fuentes: FuenteVerdadVencimiento[] = this.fuenteVerdadControl.value || [];
    return fuentes.length > 0 ? fuentes : null;
  }
}
