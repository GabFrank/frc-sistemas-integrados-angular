import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Producto } from '../../../../../productos/producto/producto.model';
import { Presentacion } from '../../../../../productos/presentacion/presentacion.model';
import { ProductoComponent } from '../../../../../productos/producto/edit-producto/producto.component';
import { MovimientoStockService } from '../../../../movimiento-stock/movimiento-stock.service';
import { ProductoService } from '../../../../../productos/producto/producto.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { BuscadorComprasService } from '../../buscador-compras.service';

export interface ComprasSearchProductoData {
  texto?: string;
  mostrarStock?: boolean;
}

export interface ComprasSearchProductoResponse {
  producto?: Producto;
  presentacion?: Presentacion;
  searchText?: string;
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-compras-search-producto-dialog',
  templateUrl: './compras-search-producto-dialog.component.html',
  styleUrls: ['./compras-search-producto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class ComprasSearchProductoDialogComponent implements OnInit, AfterViewInit {
  @ViewChild('buscarInput') buscarInput?: ElementRef<HTMLInputElement>;
  @ViewChild('tableRows', { static: false, read: ElementRef })
  tableElement?: ElementRef<HTMLElement>;

  formGroup!: FormGroup;
  dataSource = new MatTableDataSource<Producto>([]);
  displayedColumns: string[] = ['id', 'descripcion', 'codigo'];
  expandedProducto: Producto | null = null;
  selectedRowIndex = -1;
  selectedPresentacionRowIndex = -1;
  selectedPresentacion: Presentacion | null = null;
  isSearching = false;
  mostrarStockColumna = false;
  private paginaActual = 0;
  private terminoBusqueda = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ComprasSearchProductoData,
    public dialogRef: MatDialogRef<ComprasSearchProductoDialogComponent>,
    private matDialog: MatDialog,
    private buscadorComprasService: BuscadorComprasService,
    private stockService: MovimientoStockService,
    private productoService: ProductoService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.mostrarStockColumna = data?.mostrarStock === true;
    if (this.mostrarStockColumna) {
      this.displayedColumns = ['id', 'descripcion', 'codigo', 'existencia', 'acciones'];
    }
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      buscarControl: new FormControl(this.data?.texto ?? null),
    });

    this.formGroup
      .get('buscarControl')
      ?.valueChanges.pipe(
        debounceTime(DEBOUNCE_MS),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe((value: string) => {
        this.ejecutarBusqueda(value, 0, false);
      });

    const textoInicial = this.data?.texto?.trim();
    if (textoInicial) {
      this.ejecutarBusqueda(textoInicial, 0, false);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.buscarInput?.nativeElement?.focus(), 200);
  }

  ejecutarBusqueda(texto: string, page: number, append: boolean): void {
    const termino = (texto ?? '').trim();
    this.terminoBusqueda = termino;
    this.paginaActual = page;

    if (!append) {
      this.expandedProducto = null;
      this.selectedRowIndex = -1;
      this.selectedPresentacionRowIndex = -1;
      this.selectedPresentacion = null;
    }

    if (!termino) {
      this.dataSource.data = [];
      this.isSearching = false;
      this.cdr.markForCheck();
      return;
    }

    this.isSearching = true;
    this.cdr.markForCheck();

    this.buscadorComprasService
      .buscarProducto(termino, page, PAGE_SIZE, undefined, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          const productos = (res.getContent ?? [])
            .map((r) => r.producto)
            .filter((p): p is Producto => p?.id != null);

          if (append) {
            const idsExistentes = new Set(this.dataSource.data.map((p) => p.id));
            const nuevos = productos.filter((p) => !idsExistentes.has(p.id));
            this.dataSource.data = [...this.dataSource.data, ...nuevos];
          } else {
            this.dataSource.data = productos;
          }

          this.isSearching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          if (!append) {
            this.dataSource.data = [];
          }
          this.isSearching = false;
          this.notificacionService.openWarn('Error al buscar productos');
          this.cdr.markForCheck();
        },
      });
  }

  limpiarBusqueda(): void {
    this.formGroup.get('buscarControl')?.setValue(null);
    this.dataSource.data = [];
    this.expandedProducto = null;
    this.selectedRowIndex = -1;
    setTimeout(() => this.buscarInput?.nativeElement?.focus(), 50);
  }

  onFilaClick(_producto: Producto, index: number): void {
    this.expandirProducto(index);
  }

  isProductoExpandido(producto: Producto): boolean {
    return this.expandedProducto?.id != null && this.expandedProducto.id === producto?.id;
  }

  private expandirProducto(index: number): void {
    if (index < 0 || index > this.dataSource.data.length - 1) {
      return;
    }

    this.selectedPresentacionRowIndex = -1;
    this.selectedPresentacion = null;
    this.resaltarFila(index);
    this.expandedProducto = this.dataSource.data[index];
    this.cargarDetalleProducto(this.expandedProducto, index);
    this.cdr.markForCheck();
  }

  private sincronizarProductoExpandido(index: number): void {
    if (this.expandedProducto?.id == null) {
      return;
    }

    const productoActualizado = this.dataSource.data[index];
    if (productoActualizado?.id === this.expandedProducto.id) {
      this.expandedProducto = productoActualizado;
    }
  }

  resaltarFila(index: number): void {
    if (index >= 0 && index <= this.dataSource.data.length - 1) {
      this.selectedRowIndex = index;
      this.cdr.markForCheck();
    }
  }

  resaltarPresentacion(index: number): void {
    if (index < 0) {
      this.selectedPresentacionRowIndex++;
    } else if (
      index >
      (this.dataSource.data[this.selectedRowIndex]?.presentaciones?.length ?? 0) - 1
    ) {
      this.selectedPresentacionRowIndex--;
    } else {
      this.selectedPresentacionRowIndex = index;
      const producto = this.dataSource.data[this.selectedRowIndex];
      if (producto?.presentaciones) {
        this.selectedPresentacion = producto.presentaciones[index];
      }
    }
    this.cdr.markForCheck();
  }

  private presentacionesTienenPrecios(producto: Producto): boolean {
    return (producto?.presentaciones ?? []).some(
      (p) => p?.activo !== false && (p.precios?.length ?? 0) > 0
    );
  }

  cargarDetalleProducto(producto: Producto, index: number): void {
    if (this.presentacionesTienenPrecios(producto)) {
      this.resaltarPresentacion(0);
      return;
    }

    const filasCargando = [...this.dataSource.data];
    filasCargando[index] = { ...filasCargando[index], presentaciones: null };
    this.dataSource.data = filasCargando;
    this.sincronizarProductoExpandido(index);
    this.cdr.markForCheck();

    this.productoService
      .getProducto(producto.id, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          const filas = [...this.dataSource.data];
          filas[index] = { ...filas[index], presentaciones: res.presentaciones };
          this.dataSource.data = filas;
          this.sincronizarProductoExpandido(index);
          this.resaltarPresentacion(0);
          this.cdr.markForCheck();
        },
        error: () => {
          this.notificacionService.openWarn('No se pudo cargar el producto');
        },
      });
  }

  tableKeyDownEvent(tecla: string, index: number): void {
    switch (tecla) {
      case 'ArrowDown':
        this.resaltarFila(index + 1);
        this.expandedProducto = null;
        break;
      case 'ArrowUp':
        this.resaltarFila(index - 1);
        this.expandedProducto = null;
        break;
      case 'Enter':
        if (!this.isProductoExpandido(this.dataSource.data[index])) {
          this.expandirProducto(index);
        } else {
          const producto = this.dataSource.data[index];
          const presentacion =
            producto?.presentaciones?.[this.selectedPresentacionRowIndex];
          if (presentacion) {
            this.onPresentacionClick(presentacion, producto);
          }
        }
        break;
      case 'ArrowRight':
        if (this.selectedPresentacionRowIndex === -1) {
          this.resaltarPresentacion(0);
        } else {
          this.selectedPresentacionRowIndex++;
          this.resaltarPresentacion(this.selectedPresentacionRowIndex);
        }
        break;
      case 'ArrowLeft':
        if (this.selectedPresentacionRowIndex === -1) {
          this.resaltarPresentacion(0);
        } else {
          this.selectedPresentacionRowIndex--;
          this.resaltarPresentacion(this.selectedPresentacionRowIndex);
        }
        break;
      default:
        break;
    }
    this.cdr.markForCheck();
  }

  keydownEvent(tecla: string): void {
    if (tecla === 'ArrowDown' || tecla === 'Tab') {
      if (this.dataSource.data?.length > 0) {
        this.resaltarFila(0);
        this.enfocarTabla();
      }
    } else if (tecla === 'Enter') {
      const texto = this.formGroup.get('buscarControl')?.value;
      this.ejecutarBusqueda(texto, 0, false);
    }
  }

  enfocarTabla(): void {
    setTimeout(() => {
      this.tableElement?.nativeElement?.focus();
    }, 100);
  }

  onPresentacionClick(presentacion: Presentacion, producto: Producto): void {
    const searchText = this.formGroup.get('buscarControl')?.value ?? '';
    this.dialogRef.close({
      producto,
      presentacion,
      searchText,
    } as ComprasSearchProductoResponse);
  }

  mostrarStock(producto: Producto, index: number): void {
    this.stockService
      .onGetStockPorProducto(producto.id, null, true)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          const filas = [...this.dataSource.data];
          filas[index] = { ...filas[index], stockPorProducto: res };
          this.dataSource.data = filas;
          this.cdr.markForCheck();
        }
      });
  }

  cargarMasDatos(): void {
    this.ejecutarBusqueda(this.terminoBusqueda, this.paginaActual + 1, true);
  }

  abrirProductoDialog(producto?: Producto): void {
    this.matDialog
      .open(ProductoComponent, {
        data: {
          isDialog: true,
          producto,
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = [];
          this.ejecutarBusqueda(res.descripcion, 0, false);
        }
      });
  }

  salir(): void {
    this.dialogRef.close();
  }
}
