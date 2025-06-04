import { Component, Input, OnInit, ViewChild, OnChanges, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Pedido } from '../../edit-pedido/pedido.model';
import { PedidoItem } from '../../edit-pedido/pedido-item.model';
import { PedidoEstado } from '../../edit-pedido/pedido-enums';
import { ProductoProveedor } from '../../../../productos/producto-proveedor/producto-proveedor.model';
import { Producto } from '../../../../productos/producto/producto.model';
import { Presentacion } from '../../../../productos/presentacion/presentacion.model';
import { CompraItem } from '../../../compra/compra-item.model';

import { ProductoProveedorService } from '../../../../productos/producto-proveedor/producto-proveedor.service';
import { PedidoService } from '../../pedido.service';
import { ProductoService } from '../../../../productos/producto/producto.service';
import { MainService } from '../../../../../main.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { PageInfo } from '../../../../../app.component';

import { PedidoItemSucursalDialogComponent } from '../../pedido-item-sucursal/pedido-item-sucursal-dialog/pedido-item-sucursal-dialog.component';
import { AdicionarItemDialogComponent } from '../../adicionar-item-dialog/adicionar-item-dialog.component';
import { AddProductDialogComponent } from './add-product-dialog/add-product-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-detalles-del-pedido',
  templateUrl: './detalles-del-pedido.component.html',
  styleUrls: ['./detalles-del-pedido.component.scss']
})
export class DetallesDelPedidoComponent implements OnInit, OnChanges {
  @ViewChild('productosProveedorPaginator') productosProveedorPaginator: MatPaginator;
  @ViewChild('pedidoItemsPaginator') pedidoItemsPaginator: MatPaginator;

  @Input() selectedPedido: Pedido;
  @Output() pedidoChange = new EventEmitter<Pedido>();
  @Output() formValid = new EventEmitter<boolean>();

  // Form controls
  buscarProductoControl = new FormControl('');
  buscarItemsControl = new FormControl('');
  codigoProductoControl = new FormControl('');
  
  // Product selection form
  productSelectionFormGroup = new FormGroup({
    presentacion: new FormControl(null, Validators.required),
    cantidad: new FormControl(1, [Validators.required, Validators.min(0.01)]),
    precioUnitario: new FormControl(0, [Validators.required, Validators.min(0)]),
    descuentoUnitario: new FormControl(0, [Validators.min(0)])
  });

  // Data sources
  productosProveedorDataSource = new MatTableDataSource<ProductoProveedor>([]);
  pedidoItemsDataSource = new MatTableDataSource<PedidoItem>([]);
  historicoComprasDataSource = new MatTableDataSource<any>([]);

  // Table columns
  productosProveedorColumns = ['codigo', 'descripcion', 'stock', 'sugerido', 'acciones'];
  pedidoItemsColumns = ['descripcion', 'presentacion', 'cantidad', 'precioUnitario', 'precioPorPresentacion', 'total', 'acciones'];
  historicoComprasColumns = ['fecha', 'presentacion', 'cantidad', 'precio', 'acciones'];

  // Selected items
  selectedProductoProveedor: ProductoProveedor;
  selectedProducto: Producto;
  selectedPedidoItem: PedidoItem;

  // Pagination
  productosProveedorPage: PageInfo<ProductoProveedor>;
  pedidoItemsPage: PageInfo<PedidoItem>;
  historicoComprasPage: PageInfo<CompraItem>;

  // Loading states
  isLoading = false;
  isLoadingProductos = false;
  isLoadingHistorico = false;

  constructor(
    private productoProveedorService: ProductoProveedorService,
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private mainService: MainService,
    private notificacionService: NotificacionSnackbarService,
    private dialog: MatDialog,
    private dialogosService: DialogosService
  ) {}

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.setupDataSourceFiltering();
    this.loadInitialData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPedido'] && this.selectedPedido) {
      this.loadPedidoItems();
      if (this.selectedPedido.proveedor) {
        this.loadProductosProveedor();
      }
    }
  }

  private setupFormSubscriptions(): void {
    // Search productos debounced
    this.buscarProductoControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe(() => {
        this.loadProductosProveedor();
      });

    // Search items debounced
    this.buscarItemsControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        untilDestroyed(this)
      )
      .subscribe((searchText) => {
        this.filterPedidoItems(searchText);
      });

    // Product selection form validation
    this.productSelectionFormGroup.statusChanges
      .pipe(untilDestroyed(this))
      .subscribe(status => {
        this.formValid.emit(status === 'VALID' && !!this.selectedProducto);
      });
  }

  private setupDataSourceFiltering(): void {
    // Custom filter predicate for pedido items
    this.pedidoItemsDataSource.filterPredicate = (data: PedidoItem, filter: string) => {
      const searchTerm = filter.toLowerCase();
      return (
        data.producto?.codigoPrincipal?.toLowerCase().includes(searchTerm) ||
        data.producto?.descripcion?.toLowerCase().includes(searchTerm) ||
        data.presentacionCreacion?.descripcion?.toLowerCase().includes(searchTerm) ||
        data.obsCreacion?.toLowerCase().includes(searchTerm)
      );
    };
  }

  private filterPedidoItems(searchText: string): void {
    if (!searchText || searchText.trim() === '') {
      this.pedidoItemsDataSource.filter = '';
    } else {
      this.pedidoItemsDataSource.filter = searchText.trim().toLowerCase();
    }
  }

  private loadInitialData(): void {
    if (this.selectedPedido?.proveedor) {
      this.loadProductosProveedor();
      this.loadPedidoItems();
    }
  }

  loadProductosProveedor(page = 0, size = 15): void {
    if (!this.selectedPedido?.proveedor) return;

    this.isLoadingProductos = true;
    const texto = this.buscarProductoControl.value || '';

    this.productoProveedorService.getByProveedorId(
      this.selectedPedido.proveedor.id,
      texto,
      page,
      size
    ).pipe(untilDestroyed(this))
    .subscribe({
      next: (response) => {
        this.productosProveedorPage = response;
        this.productosProveedorDataSource.data = response.getContent;
        this.isLoadingProductos = false;
      },
      error: () => {
        this.isLoadingProductos = false;
        this.notificacionService.openWarn('Error al cargar productos del proveedor');
      }
    });
  }

  loadPedidoItems(page = 0, size = 15): void {
    if (!this.selectedPedido?.id) return;

    this.isLoading = true;
    this.pedidoService.onGetPedidoItemPorPedido(this.selectedPedido.id, page, size)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.pedidoItemsPage = response;
          // Calculate computed properties for each item to avoid function calls in template
          const itemsWithComputedProps = response.getContent.map(item => {
            const precioUnitario = item.precioUnitarioCreacion || 0;
            const descuentoUnitario = item.descuentoUnitarioCreacion || 0;
            const cantidadPresentacion = item.presentacionCreacion?.cantidad || 1;
            const cantidadCreacion = item.cantidadCreacion || 0;
            
            const computedItem = Object.assign(item, {
              // Computed properties to avoid function calls in template
              precioPorPresentacionCalculado: precioUnitario * cantidadPresentacion,
              descuentoPorPresentacionCalculado: descuentoUnitario * cantidadPresentacion,
              netPrecioUnitarioCalculado: precioUnitario - descuentoUnitario,
              netPrecioPorPresentacionCalculado: (precioUnitario * cantidadPresentacion) - (descuentoUnitario * cantidadPresentacion),
              // Total with discount applied
              totalConDescuentoCalculado: cantidadCreacion * cantidadPresentacion * (precioUnitario - descuentoUnitario)
            });
            
            return computedItem;
          });
          
          this.pedidoItemsDataSource.data = itemsWithComputedProps as any;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.notificacionService.openWarn('Error al cargar items del pedido');
        }
      });
  }

  // Event handlers
  onProductoProveedorSelect(productoProveedor: ProductoProveedor): void {
    this.selectedProductoProveedor = productoProveedor;
    this.selectedProducto = productoProveedor.producto;
    
    // Reset form with product data
    this.productSelectionFormGroup.patchValue({
      presentacion: this.selectedProducto.presentaciones?.[0],
      cantidad: 1,
      precioUnitario: 0,
      descuentoUnitario: 0
    });

    // Load historical purchases for this product
    this.loadHistoricoCompras();
  }

  loadHistoricoCompras(): void {
    if (!this.selectedProducto?.id) return;

    this.isLoadingHistorico = true;
    this.productoService.onGetProductoPorId(this.selectedProducto.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.historicoComprasDataSource.data = response.productoUltimasCompras || [];
          this.isLoadingHistorico = false;
        },
        error: () => {
          this.isLoadingHistorico = false;
        }
      });
  }

  onAddProductToPedido(): void {
    if (!this.selectedProducto || this.productSelectionFormGroup.invalid) {
      this.notificacionService.openWarn('Complete todos los campos requeridos');
      return;
    }

    const formValue = this.productSelectionFormGroup.value;
    
    const pedidoItem = new PedidoItem();
    pedidoItem.pedido = this.selectedPedido;
    pedidoItem.producto = this.selectedProducto;
    pedidoItem.presentacionCreacion = formValue.presentacion;
    pedidoItem.cantidadCreacion = formValue.cantidad;
    pedidoItem.precioUnitarioCreacion = formValue.precioUnitario;
    pedidoItem.descuentoUnitarioCreacion = formValue.descuentoUnitario || 0;
    pedidoItem.valorTotal = formValue.cantidad * formValue.presentacion.cantidad * 
                          (formValue.precioUnitario - (formValue.descuentoUnitario || 0));
    pedidoItem.usuarioCreacion = this.mainService.usuarioActual;

    this.pedidoService.onSaveItem(pedidoItem.toInput())
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.notificacionService.openSucess('Producto agregado al pedido');
          this.loadPedidoItems();
          this.clearProductSelection();
          
          // Open sucursal dialog if multiple sucursales
          if (this.selectedPedido.sucursalInfluenciaList?.length > 1) {
            this.openSucursalDialog(response);
          }
        },
        error: () => {
          this.notificacionService.openWarn('Error al agregar producto al pedido');
        }
      });
  }

  openSucursalDialog(pedidoItem: PedidoItem, isEditing: boolean = false): void {
    // isEditting true significa que se esta editando un item del pedido, por lo que no se debe setear la sucursal de entrega por defecto
    this.dialog.open(PedidoItemSucursalDialogComponent, {
      data: {
        pedidoItem,
        sucursalInfluenciaList: this.selectedPedido.sucursalInfluenciaList?.map(s => s.sucursal),
        sucursalEntregaList: this.selectedPedido.sucursalEntregaList?.map(s => s.sucursal),
        autoSet: this.selectedPedido.sucursalInfluenciaList?.length === 1 && !isEditing
      },
      width: '70%',
      height: '60%'
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadPedidoItems();
      }
    });
  }

  onEditPedidoItem(pedidoItem: PedidoItem): void {
    this.dialog.open(AddProductDialogComponent, {
      data: {
        pedido: this.selectedPedido,
        pedidoItem: pedidoItem,
        isEditing: true
      },
      width: '95%',
      height: '85%',
      disableClose: false,
      autoFocus: false
    }).afterClosed().subscribe(result => {
      if (result?.updated) {
        this.loadPedidoItems();
        this.pedidoChange.emit(this.selectedPedido);
      }
    });
  }

  onDeletePedidoItem(pedidoItem: PedidoItem): void {
    // Check if deletion is allowed based on pedido estado
    if (!this.isDeleteAllowed()) {
      this.notificacionService.openWarn('Solo se pueden eliminar items cuando el pedido está en estado ACTIVO');
      return;
    }

    // Ask for confirmation since deletion is irreversible
    const message = `¿Está seguro que desea eliminar este item del pedido?\n\nProducto: ${pedidoItem.producto?.descripcion}\nCantidad: ${pedidoItem.cantidadCreacion}\n\nEsta acción es irreversible.`;
    
    this.dialogosService.confirm(
      'Confirmar eliminación',
      message
    ).subscribe(confirmed => {
      if (confirmed) {
        this.pedidoService.onDeletePedidoItem(pedidoItem.id)
          .pipe(untilDestroyed(this))
          .subscribe({
            next: () => {
              this.notificacionService.openSucess('Item eliminado del pedido exitosamente');
              this.loadPedidoItems();
              // Emit pedido change to update parent component
              this.pedidoChange.emit(this.selectedPedido);
            },
            error: () => {
              this.notificacionService.openWarn('Error al eliminar item del pedido');
            }
          });
      }
    });
  }

  /**
   * Check if item deletion is allowed based on pedido estado
   * Only allow deletion when pedido is in ACTIVO state
   */
  isDeleteAllowed(): boolean {
    return this.selectedPedido?.estado === PedidoEstado.ACTIVO;
  }

  onManageSucursales(pedidoItem: PedidoItem): void {
    this.openSucursalDialog(pedidoItem, true);
  }

  onRepeatFromHistory(compraItem: any): void {
    // Implement logic to repeat purchase
    this.notificacionService.openWarn('Funcionalidad de repetir compra en desarrollo');
  }

  clearProductSelection(): void {
    this.selectedProductoProveedor = null;
    this.selectedProducto = null;
    this.productSelectionFormGroup.reset();
    this.historicoComprasDataSource.data = [];
  }

  // Pagination handlers
  onProductosProveedorPageChange(event: any): void {
    this.loadProductosProveedor(event.pageIndex, event.pageSize);
  }

  onPedidoItemsPageChange(event: any): void {
    this.loadPedidoItems(event.pageIndex, event.pageSize);
  }

  // Utility methods
  getMonedaSymbol(): string {
    return this.selectedPedido?.moneda?.simbolo || '$';
  }

  isGuarani(): boolean {
    return this.selectedPedido?.moneda?.denominacion?.includes('GUARANI') || false;
  }

  getTotalValue(): number {
    return this.pedidoItemsDataSource.data.reduce((total, item) => {
      // Use the calculated total with discount applied, fallback to original valorTotal if not available
      const itemTotal = (item as any).totalConDescuentoCalculado || item.valorTotal || 0;
      return total + itemTotal;
    }, 0);
  }

  openAddProductDialog(): void {
    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      data: {
        pedido: this.selectedPedido
      },
      width: '80%',
      height: '80%',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.added) {
        this.loadPedidoItems();
        
        // Open sucursal dialog if multiple sucursales
        if (this.selectedPedido.sucursalInfluenciaList?.length > 1 && result.pedidoItem) {
          this.openSucursalDialog(result.pedidoItem);
        }
      }
    });
  }
}
