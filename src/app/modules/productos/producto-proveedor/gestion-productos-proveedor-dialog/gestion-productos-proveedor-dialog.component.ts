import {
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Producto } from '../../producto/producto.model';
import { ProductoProveedor } from '../producto-proveedor.model';
import { ProductoProveedorService } from '../producto-proveedor.service';
import { DesvincularProductoProveedorGQL } from '../graphql/desvincularProductoProveedor';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData,
} from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { SearchProductoWithFiltersGQL } from '../../producto/graphql/searchWithFilters';
import { getDigitoVerificadorString } from '../../../../commons/core/utils/rucUtils';

export interface GestionProductosProveedorDialogData {
  proveedor: Proveedor;
}

/**
 * Diálogo para gestionar productos vinculados a un proveedor (proveedor como centro).
 * TODO: Cuando exista la lista de proveedores, añadir en su menú de acciones un ítem
 * "Gestionar productos" que abra este diálogo con el proveedor de la fila.
 */

export interface ProductoProveedorProductoRow extends ProductoProveedor {
  productoDescripcionComputed: string;
  productoCodigoComputed: string;
}

const MOTIVOS_DESVINCULAR = [
  { value: 'PROVEEDOR YA NO POSEE EL PRODUCTO', label: 'Proveedor ya no posee el producto' },
  { value: 'PRECIO INCOMPETENTE', label: 'Precio incompetente' },
  { value: 'MALA CALIDAD DE ENTREGA', label: 'Mala calidad de entrega' },
  { value: 'PRODUCTO YA NO EXISTE', label: 'Producto ya no existe' },
];

@Component({
  selector: 'app-gestion-productos-proveedor-dialog',
  templateUrl: './gestion-productos-proveedor-dialog.component.html',
  styleUrls: ['./gestion-productos-proveedor-dialog.component.scss'],
})
export class GestionProductosProveedorDialogComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  private destroy$ = new Subject<void>();

  proveedor: Proveedor;
  headerNombreComputed = '';
  headerDocumentoComputed = '';
  documentoConDigitoVerificadorComputed = '';

  selectedProductoComputed: Producto | null = null;
  addButtonDisabledComputed = true;
  selectedProductoDisplayComputed = '';

  dataSource = new MatTableDataSource<ProductoProveedorProductoRow>([]);
  displayedColumns: string[] = ['id', 'descripcion', 'codigo', 'acciones'];
  loading = false;
  pageIndex = 0;
  pageSize = 10;
  searchText = '';
  totalElements = 0;

  motivosDesvincularComputed = MOTIVOS_DESVINCULAR;

  constructor(
    public dialogRef: MatDialogRef<GestionProductosProveedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionProductosProveedorDialogData,
    private productoProveedorService: ProductoProveedorService,
    private desvincularProductoProveedorGQL: DesvincularProductoProveedorGQL,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private searchProductoWithFiltersGQL: SearchProductoWithFiltersGQL
  ) {
    this.proveedor = data?.proveedor || null;
  }

  ngOnInit(): void {
    this.updateHeaderComputed();
    this.loadList();
  }

  private updateHeaderComputed(): void {
    this.headerNombreComputed = this.proveedor?.persona?.nombre ?? '';
    const doc = this.proveedor?.persona?.documento ?? '';
    this.headerDocumentoComputed = doc;
    this.documentoConDigitoVerificadorComputed =
      doc.length >= 5 ? doc + getDigitoVerificadorString(doc) : doc;
  }

  loadList(): void {
    if (!this.proveedor?.id) return;
    this.loading = true;
    this.productoProveedorService
      .getByProveedorId(this.proveedor.id, this.searchText || null, this.pageIndex, this.pageSize, undefined, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.loading = false;
          this.totalElements = page?.getTotalElements ?? 0;
          const content = page?.getContent ?? [];
          const rows: ProductoProveedorProductoRow[] = content.map((pp: ProductoProveedor) => ({
            ...pp,
            productoDescripcionComputed: pp?.producto?.descripcion ?? '',
            productoCodigoComputed: pp?.producto?.codigoPrincipal ?? '',
          }));
          this.dataSource.data = rows;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onPageEvent(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadList();
  }

  onBuscarProducto(): void {
    const tableData: TableData[] = [
      { id: 'id', nombre: 'ID' },
      { id: 'descripcion', nombre: 'Descripción' },
      { id: 'codigoPrincipal', nombre: 'Código' },
    ];
    const dialogData: SearchListtDialogData = {
      query: this.searchProductoWithFiltersGQL,
      tableData,
      titulo: 'Buscar producto',
      search: true,
      inicialSearch: false,
      paginator: true,
      searchFieldName: 'texto',
      queryData: {
        texto: null,
        page: 0,
        size: 15,
      },
    };
    this.matDialog
      .open(SearchListDialogComponent, {
        data: dialogData,
        width: '60%',
        height: '80%',
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: Producto) => {
        if (res != null && res.id != null) {
          this.selectedProductoComputed = res;
          this.selectedProductoDisplayComputed = res.descripcion || String(res.id);
          this.addButtonDisabledComputed = false;
        }
      });
  }

  onRemoverProducto(): void {
    this.selectedProductoComputed = null;
    this.selectedProductoDisplayComputed = '';
    this.addButtonDisabledComputed = true;
  }

  onAdicionarProducto(): void {
    if (!this.selectedProductoComputed?.id || !this.proveedor?.id) return;
    this.productoProveedorService
      .saveProductoProveedor({
        productoId: this.selectedProductoComputed.id,
        proveedorId: this.proveedor.id,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.onRemoverProducto();
          this.loadList();
        },
      });
  }

  onDesvincular(row: ProductoProveedorProductoRow, motivo: string): void {
    if (!row?.id) {
      this.notificacionService.openAlgoSalioMal('No se pudo identificar el vínculo a desvincular');
      return;
    }
    this.desvincularProductoProveedorGQL
      .mutate({ id: row.id, motivo })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.data?.data) {
            this.notificacionService.openSucess('Producto desvinculado correctamente');
            this.loadList();
          }
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal('Error al desvincular');
        },
      });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
