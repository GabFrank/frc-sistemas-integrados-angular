import { Component, ElementRef, Input, OnInit, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BehaviorSubject, forkJoin } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap, tap } from "rxjs/operators";

import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { UsuarioSearchPageGQL } from "../../../personas/usuarios/graphql/usuarioSearchPage";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { InventarioProductoItem } from "../inventario.model";

export type InventarioProductoItemView = InventarioProductoItem & {
  vencimientoColor: string;
  diasVencimientoTexto: string;
  diasVencimientoClase: string;
};
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { PageEvent } from "@angular/material/paginator";
import { ProductosVencidosGQL } from "../graphql/productos-vencidos.gql";
import { TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { EditTransferenciaComponent } from "../../transferencia/edit-transferencia/edit-transferencia.component";
import { TabData } from "../../../../layouts/tab/tab.service";
import { Transferencia, TransferenciaEstado, TipoTransferencia, EtapaTransferencia, TransferenciaItem } from "../../transferencia/transferencia.model";
import { TransferenciaService } from "../../transferencia/transferencia.service";
import { SeleccionarSucursalDialogComponent } from "../../transferencia/seleccionar-sucursal-dialog/seleccionar-sucursal-dialog.component";

export interface ProductosVencidosFilters {
  startDate?: string;
  endDate?: string;
  sucursalIdList?: number[];
  usuarioIdList?: number[];
  productoIdList?: number[];
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
  dataSource = new MatTableDataSource<InventarioProductoItemView>([]);
  expandedInventarioProductoItem: InventarioProductoItem;
  fechaFormGroup: FormGroup;
  sucursalControl = new FormControl();
  buscarUsuarioControl = new FormControl();
  buscarProductoControl = new FormControl();
  soloRealmenteVencidosControl = new FormControl(false);
  sucursalList: Sucursal[] = [];
  selectedUsuario: Usuario | null = null;
  selectedProducto: Producto | null = null;
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  readonly pageSizeOptions = [15, 25, 50, 100];
  private readonly vencimientoColorCache = new Map<string, string>();
  private readonly diasDiferenciaCache = new Map<string, number>();
  inicioMinDate: Date | null = null;

  private filtersSubject = new BehaviorSubject<ProductosVencidosFilters>({
    page: 0,
    size: 15
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
    "sucursal",
    "sector",
    "zona"
  ];
  private readonly COLORS = {
    SUCCESS: "#4caf50",
    WARNING: "#ff9800",
    DANGER: "#f44336",
    DEFAULT: "#ffffff"
  };

  constructor(
    private sucursalService: SucursalService,
    private tabService: TabService,
    private usuarioSearchGQL: UsuarioSearchPageGQL,
    private productosVencidosGQL: ProductosVencidosGQL,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private mainService: MainService,
    private notificacion: NotificacionSnackbarService,
    private transferenciaService: TransferenciaService
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

  ngOnDestroy(): void {
    this.vencimientoColorCache.clear();
    this.diasDiferenciaCache.clear();
  }
  trackBySucursalId(index: number, item: Sucursal): number {
    return item.id;
  }

  trackByItemId(index: number, item: InventarioProductoItem): number {
    return item.id || index;
  }
  onRowClick(row: InventarioProductoItem): void {
    this.expandedInventarioProductoItem = this.expandedInventarioProductoItem === row ? null : row;
  }

  private initializeSubscriptions(): void {
    this.filtersSubject.asObservable().pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
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
    return this.productosVencidosGQL.fetch(filters).pipe(
      tap(result => {
        this.handleProductosVencidosResponse(result);
      })
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
    const productosVencidos = pageData.getContent || [];
    const enriched: InventarioProductoItemView[] = productosVencidos.map((item: InventarioProductoItem) => {
      const dias = item?.vencimiento ? this.calculateDiasDiferencia(item.vencimiento) : null;
      const vencimientoColor = this.resolveVencimientoColor(dias);
      const diasVencimientoTexto = this.resolveDiasVencimientoTexto(dias);
      const diasVencimientoClase = this.resolveDiasVencimientoClase(dias);
      return {
        ...item,
        vencimientoColor,
        diasVencimientoTexto,
        diasVencimientoClase,
      } as InventarioProductoItemView;
    });

    this.dataSource.data = enriched;
    this.length = pageData.getTotalElements || 0;

    this.cdRef.detectChanges();
  }

  private setEmptyData(): void {
    this.dataSource.data = [];
    this.length = 0;
  }
  onFiltrar(): void {
    this.pageIndex = 0;
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
    this.selectedProducto = null;
    this.selectedUsuario = null;
    this.vencimientoColorCache.clear();
    this.diasDiferenciaCache.clear();

    this.onFiltrar();
  }

  onGenerarPdf(): void {
    console.log("Generar PDF de productos vencidos");
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
            trItem.presentacionPreTransferencia = it.presentacion;
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

              this.vencimientoColorCache.clear();
              this.diasDiferenciaCache.clear();

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
      const nuevasSucursales = [...sucursalesActuales, sucursalDestino];
      this.sucursalControl.setValue(nuevasSucursales);
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
    const data: PdvSearchProductoData = {
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
        this.updateFilters();
      }
    });
  }

  onClearProducto(): void {
    this.selectedProducto = null;
    this.buscarProductoControl.setValue("");
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
      paginator: true,
      searchFieldName: "texto",
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
        this.updateFilters();
      }
    });
  }

  onClearUsuario(): void {
    this.selectedUsuario = null;
    this.buscarUsuarioControl.setValue("");
    this.updateFilters();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateFilters();
  }
  private resolveVencimientoColor(diasDiferencia: number | null): string {
    if (diasDiferencia == null) return this.COLORS.DEFAULT;
    if (diasDiferencia < 0) return this.COLORS.DANGER;
    if (diasDiferencia <= 7) return this.COLORS.WARNING;
    return this.COLORS.SUCCESS;
  }

  private calculateDiasDiferencia(vencimiento: string | Date): number {
    const cacheKey = typeof vencimiento === 'string' ? vencimiento : vencimiento.toISOString();

    if (this.diasDiferenciaCache.has(cacheKey)) {
      return this.diasDiferenciaCache.get(cacheKey)!;
    }

    const vencimientoDate = new Date(vencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    vencimientoDate.setHours(0, 0, 0, 0);

    const dias = Math.ceil((vencimientoDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    this.diasDiferenciaCache.set(cacheKey, dias);

    return dias;
  }
  private resolveDiasVencimientoTexto(dias: number | null): string {
    if (dias == null) return '-';
    if (dias < 0) return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
    if (dias === 0) return 'Vence hoy';
    return `${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`;
  }
  private resolveDiasVencimientoClase(dias: number | null): string {
    if (dias == null) return '';
    if (dias < 0) return 'dias-vencimiento-cell vencido';
    if (dias <= 7) return 'dias-vencimiento-cell por-vencer';
    return 'dias-vencimiento-cell vigente';
  }
  private updateFilters(): void {
    const filters: ProductosVencidosFilters = {
      startDate: this.getStartDate(),
      endDate: this.getEndDate(),
      sucursalIdList: this.sucursalIdList(),
      usuarioIdList: this.usuarioIdList(),
      productoIdList: this.productoIdList(),
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
    const sucursales = this.sucursalControl.value;
    return sucursales?.length > 0 ? sucursales.map((s: Sucursal) => s.id) : null;
  }


  private usuarioIdList(): number[] | null {
    return this.selectedUsuario ? [this.selectedUsuario.id] : null;
  }

  private productoIdList(): number[] | null {
    return this.selectedProducto ? [this.selectedProducto.id] : null;
  }
}