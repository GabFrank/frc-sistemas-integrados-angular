import { Component, ElementRef, Input, OnInit, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { BehaviorSubject, combineLatest } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap, tap } from "rxjs/operators";

import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Sector } from "../../../empresarial/sector/sector.model";
import { SectorService } from "../../../empresarial/sector/sector.service";
import { Zona } from "../../../empresarial/zona/zona.model";
import { ZonaService } from "../../../empresarial/zona/zona.service";
import { UsuarioSearchGQL } from "../../../personas/usuarios/graphql/usuarioSearch";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { InventarioProductoItem } from "../inventario.model";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { PageEvent } from "@angular/material/paginator";
import { ProductosVencidosGQL } from "../graphql/productos-vencidos.gql";
import { TabService } from "../../../../layouts/tab/tab.service";

export interface OrderList {
  nombre: string;
  value: string;
  tipo: TipoOrder[];
}

export interface TipoOrder {
  nombre: string;
  value: string;
}

export interface ProductosVencidosFilters {
  startDate?: string;
  endDate?: string;
  sucursalIdList?: number[];
  sectorIdList?: number[];
  zonaIdList?: number[];
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
  dataSource = new MatTableDataSource<InventarioProductoItem>([]);
  expandedInventarioProductoItem: InventarioProductoItem;
  fechaFormGroup: FormGroup;
  sucursalControl = new FormControl();
  sectorControl = new FormControl();
  zonaControl = new FormControl();
  buscarUsuarioControl = new FormControl();
  buscarProductoControl = new FormControl();
  ordenarPorControl = new FormControl();
  soloRealmenteVencidosControl = new FormControl(false);
  sucursalList: Sucursal[] = [];
  sectorList: Sector[] = [];
  zonaList: Zona[] = [];
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
  today = new Date();
  readonly orderList: OrderList[] = [
    {
      nombre: "Fecha de creación",
      value: "creadoEn",
      tipo: [
        { nombre: "Ascendente", value: "ASC" },
        { nombre: "Descendente", value: "DESC" },
      ],
    },
    {
      nombre: "Vencimiento",
      value: "vencimiento",
      tipo: [
        { nombre: "Ascendente", value: "ASC" },
        { nombre: "Descendente", value: "DESC" },
      ],
    },
    {
      nombre: "Producto",
      value: "producto",
      tipo: [
        { nombre: "Ascendente", value: "ASC" },
        { nombre: "Descendente", value: "DESC" },
      ],
    },
    {
      nombre: "Sucursal",
      value: "sucursal",
      tipo: [
        { nombre: "Ascendente", value: "ASC" },
        { nombre: "Descendente", value: "DESC" },
      ],
    },
  ];

  readonly displayedColumns: string[] = [
    "descripcion",
    "codigoBarras",
    "cantidadSistema",
    "vencimiento",
    "sucursal",
  ];
  private readonly COLORS = {
    SUCCESS: "#4caf50",
    WARNING: "#ff9800",
    DANGER: "#f44336",
    DEFAULT: "#ffffff"
  };

  constructor(
    private sucursalService: SucursalService,
    private sectorService: SectorService,
    private zonaService: ZonaService,
    private tabService: TabService,
    private usuarioSearchGQL: UsuarioSearchGQL,
    private productosVencidosGQL: ProductosVencidosGQL,
    private dialog: MatDialog,
    private cdRef: ChangeDetectorRef
  ) {
    this.fechaFormGroup = new FormGroup({
      inicio: new FormControl(),
      fin: new FormControl(),
    });
  }

  ngOnInit(): void {
    this.initializeSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
  }
  trackBySucursalId(index: number, item: Sucursal): number {
    return item.id;
  }

  trackBySectorId(index: number, item: Sector): number {
    return item.id;
  }

  trackByZonaId(index: number, item: Zona): number {
    return item.id;
  }

  trackByOrderValue(index: number, item: OrderList): string {
    return item.value;
  }

  trackByTipoValue(index: number, item: TipoOrder): string {
    return item.value;
  }

  trackByItemId(index: number, item: InventarioProductoItem): number {
    return item.id || index;
  }
  onRowClick(row: InventarioProductoItem): void {
    this.expandedInventarioProductoItem = this.expandedInventarioProductoItem === row ? null : row;
  }

  private initializeSubscriptions(): void {
    combineLatest([
      this.filtersSubject.asObservable()
    ]).pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) => 
        JSON.stringify(prev[0]) === JSON.stringify(curr[0])
      ),
      switchMap(([filters]) => this.loadProductosVencidos(filters)),
      untilDestroyed(this)
    ).subscribe();
    
    this.ordenarPorControl.valueChanges.pipe(
      untilDestroyed(this)
    ).subscribe(() => {
    });
  }

  private loadInitialData(): void {
    this.loadSucursales();
    this.loadSectores();
    this.loadZonas();
  }

  private loadSucursales(): void {
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        this.sucursalList = data;
        this.cdRef.detectChanges();
      });
  }

  private loadSectores(): void {
    this.sectorService.onGetSectores(1)
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        this.sectorList = data;
        this.cdRef.detectChanges();
      });
  }

  private loadZonas(): void {
    this.zonaService.onGetZonas()
      .pipe(untilDestroyed(this))
      .subscribe(data => {
        this.zonaList = data;
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
    
    this.dataSource.data = productosVencidos;
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
    this.fechaFormGroup.reset();
    this.sucursalControl.setValue(null);
    this.sectorControl.setValue(null);
    this.zonaControl.setValue(null);
    this.buscarProductoControl.setValue("");
    this.buscarUsuarioControl.setValue("");
    this.soloRealmenteVencidosControl.setValue(false);
    this.selectedProducto = null;
    this.selectedUsuario = null;
    this.ordenarPorControl.setValue(null);
    this.onFiltrar();
  }

  onGenerarPdf(): void {
    console.log("Generar PDF de productos vencidos");
  }

  onSeleccionarTodasSucursales(): void {
    this.sucursalControl.setValue([...this.sucursalList]);
  }

  onSeleccionarTodosSectores(): void {
    this.sectorControl.setValue([...this.sectorList]);
  }

  onSeleccionarTodasZonas(): void {
    this.zonaControl.setValue([...this.zonaList]);
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
  getVencimientoColor(item: InventarioProductoItem): string {
    if (!item.vencimiento) return this.COLORS.DEFAULT;
    
    const diasDiferencia = this.calculateDiasDiferencia(item.vencimiento);
    
    if (diasDiferencia < 0) return this.COLORS.DANGER;
    if (diasDiferencia <= 7) return this.COLORS.WARNING;
    return this.COLORS.SUCCESS;
  }

  private calculateDiasDiferencia(vencimiento: string | Date): number {
    const vencimientoDate = new Date(vencimiento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    vencimientoDate.setHours(0, 0, 0, 0);
    
    return Math.ceil((vencimientoDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }
  private updateFilters(): void {
    const filters: ProductosVencidosFilters = {
      startDate: this.getStartDate(),
      endDate: this.getEndDate(),
      sucursalIdList: this.getSucursalIdList(),
      sectorIdList: this.getSectorIdList(),
      zonaIdList: this.getZonaIdList(),
      usuarioIdList: this.getUsuarioIdList(),
      productoIdList: this.getProductoIdList(),
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

  private getSucursalIdList(): number[] | null {
    const sucursales = this.sucursalControl.value;
    return sucursales?.length > 0 ? sucursales.map((s: Sucursal) => s.id) : null;
  }

  private getSectorIdList(): number[] | null {
    const sectores = this.sectorControl.value;
    return sectores?.length > 0 ? sectores.map((s: Sector) => s.id) : null;
  }

  private getZonaIdList(): number[] | null {
    const zonas = this.zonaControl.value;
    return zonas?.length > 0 ? zonas.map((z: Zona) => z.id) : null;
  }

  private getUsuarioIdList(): number[] | null {
    return this.selectedUsuario ? [this.selectedUsuario.id] : null;
  }

  private getProductoIdList(): number[] | null {
    return this.selectedProducto ? [this.selectedProducto.id] : null;
  }
}