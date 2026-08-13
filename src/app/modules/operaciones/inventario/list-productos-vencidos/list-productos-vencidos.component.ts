import { Component, ElementRef, Input, OnInit, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BehaviorSubject, forkJoin, of } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap, tap } from "rxjs/operators";

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
import { PageEvent } from "@angular/material/paginator";
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

@UntilDestroy()
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
  dataSource = new MatTableDataSource<ProductoVencidoView>([]);
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
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  readonly pageSizeOptions = [15, 25, 50, 100];

  private filtersSubject = new BehaviorSubject<ProductosVencidosFilters>({
    page: 0,
    size: 15
  });

  private isDialogOpen = false;
  private forceRefresh = false;
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
    this.initializeSubscriptions();
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

  private initializeSubscriptions(): void {
    this.filtersSubject.asObservable().pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => {
        if (this.forceRefresh) {
          this.forceRefresh = false;
          return false;
        }
        return JSON.stringify(prev) === JSON.stringify(curr);
      }),
      switchMap((filters) => this.loadProductosVencidos(filters)),
      untilDestroyed(this)
    ).subscribe();
  }

  private loadInitialData(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    this.fechaFormGroup.get("inicio")?.setValue(start);
    this.fechaFormGroup.get("fin")?.setValue(end);
    this.pageIndex = 0;
    this.pageSize = 15;
    this.updateFilters();
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

  private loadProductosVencidos(filters: ProductosVencidosFilters) {
    const { requestId, signal } = this.cargandoService.openDialog(
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
        fetchOptions: { signal },
      },
    }).pipe(
      tap(result => {
        if (result.errors?.length) {
          console.error('Error en productosVencidos:', result.errors);
          this.notificacion.openAlgoSalioMal(
            result.errors[0]?.message || 'Error al buscar productos vencidos'
          );
          this.setEmptyData();
          this.cdRef.detectChanges();
          return;
        }
        this.handleProductosVencidosResponse(result);
      }),
      catchError(error => {
        // Ej: servidor offline. Mostrar aviso en vez de matar la suscripción de filtros.
        console.error('Error en productosVencidos:', error);
        this.notificacion.openAlgoSalioMal('Error al buscar productos vencidos');
        this.setEmptyData();
        this.cdRef.detectChanges();
        return of(null);
      }),
      // Cierra el spinner en éxito, error o cancelación (switchMap al cambiar filtros).
      finalize(() => this.cargandoService.closeDialog(requestId))
    );
  }

  private handleProductosVencidosResponse(result: any): void {
    if (!result?.data?.productosVencidos) {
      console.error('Estructura de respuesta inválida');
      this.setEmptyData();
      this.cdRef.detectChanges();
      return;
    }

    const pageData = result.data.productosVencidos;
    this.dataSource.data = pageData.getContent || [];
    this.length = pageData.getTotalElements || 0;
    this.cdRef.detectChanges();
  }

  private setEmptyData(): void {
    this.dataSource.data = [];
    this.length = 0;
  }

  onFiltrar(): void {
    this.pageIndex = 0;
    this.forceRefresh = true;
    this.updateFilters();
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
    // se mandan los mismos filtros que updateFilters() pero sin page/size.
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
    const items = this.dataSource.data || [];
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
            return this.transferenciaService.onSaveTransferenciaItem(trItem.toInput());
          });

          if (ops.length === 0) {
            this.abrirTransferenciaTab(t.id);
            return;
          }

          forkJoin(ops).pipe(untilDestroyed(this)).subscribe({
            next: () => {
              this.actualizarFiltrosDespuesRetiro(res.sucursalOrigen as Sucursal, res.sucursalDestino as Sucursal);
              this.forceRefresh = true;
              this.updateFilters();

              this.notificacion.openSucess(`Transferencia ${t.id} creada exitosamente. Los productos han sido agregados.`);
              this.abrirTransferenciaTab(t.id);
            },
            error: (error) => {
              console.error('Error al agregar productos a la transferencia:', error);
              this.notificacion.openAlgoSalioMal('Error al agregar algunos productos a la transferencia');
              this.abrirTransferenciaTab(t.id);
            },
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
        this.pageIndex = 0;
        this.forceRefresh = true;
        this.updateFilters();
      }
    });
  }

  onClearProducto(): void {
    this.selectedProducto = null;
    this.buscarProductoControl.setValue("");
    this.pageIndex = 0;
    this.forceRefresh = true;
    this.updateFilters();
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
        this.pageIndex = 0;
        this.forceRefresh = true;
        this.updateFilters();
      }
    });
  }

  onClearUsuario(): void {
    this.selectedUsuario = null;
    this.buscarUsuarioControl.setValue("");
    this.pageIndex = 0;
    this.forceRefresh = true;
    this.updateFilters();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateFilters();
  }

  private updateFilters(): void {
    const filters: ProductosVencidosFilters = {
      startDate: this.getStartDate(),
      endDate: this.getEndDate(),
      sucursalIdList: this.sucursalIdList(),
      usuarioIdList: this.usuarioIdList(),
      productoIdList: this.productoIdList(),
      fuenteVerdadList: this.fuenteVerdadList(),
      soloRealmenteVencidos: this.soloRealmenteVencidosControl.value,
      page: this.pageIndex,
      size: this.pageSize
    };

    this.filtersSubject.next(filters);
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
