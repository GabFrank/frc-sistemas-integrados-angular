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
  dataSource = new MatTableDataSource<InventarioProductoItem>([]);
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
  
  private filtersSubject = new BehaviorSubject<ProductosVencidosFilters>({
    page: 0,
    size: 15
  });

  private isDialogOpen = false;
  readonly today = new Date();

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

  }

  private loadInitialData(): void {
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

    const cacheKey = `${item.id}_${item.vencimiento}`;
    if (this.vencimientoColorCache.has(cacheKey)) {
      return this.vencimientoColorCache.get(cacheKey)!;
    }

    const diasDiferencia = this.calculateDiasDiferencia(item.vencimiento);
    let color: string;

    if (diasDiferencia < 0) {
      color = this.COLORS.DANGER;
    } else if (diasDiferencia <= 7) {
      color = this.COLORS.WARNING;
    } else {
      color = this.COLORS.SUCCESS;
    }

    this.vencimientoColorCache.set(cacheKey, color);
    return color;
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
  getDiasVencimientoTexto(item: InventarioProductoItem): string {
    if (!item.vencimiento) return '-';
    
    const dias = this.calculateDiasDiferencia(item.vencimiento);
    
    if (dias < 0) {
      return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
    } else if (dias === 0) {
      return 'Vence hoy';
    } else {
      return `${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`;
    }
  }
  getDiasVencimientoClase(item: InventarioProductoItem): string {
    if (!item.vencimiento) return '';
    
    const dias = this.calculateDiasDiferencia(item.vencimiento);
    
    if (dias < 0) {
      return 'dias-vencimiento-cell vencido';
    } else if (dias <= 7) {
      return 'dias-vencimiento-cell por-vencer';
    } else {
      return 'dias-vencimiento-cell vigente';
    }
  }
  private updateFilters(): void {
    const filters: ProductosVencidosFilters = {
      startDate: this.getStartDate(),
      endDate: this.getEndDate(),
      sucursalIdList: this.getSucursalIdList(),
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


  private getUsuarioIdList(): number[] | null {
    return this.selectedUsuario ? [this.selectedUsuario.id] : null;
  }

  private getProductoIdList(): number[] | null {
    return this.selectedProducto ? [this.selectedProducto.id] : null;
  }
}