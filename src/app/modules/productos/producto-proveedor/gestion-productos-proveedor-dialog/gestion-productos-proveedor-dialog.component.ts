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
import { ContextoConsulta, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.service';

/**
 * Lista de vínculos: el error de red y el del servidor llegan al diálogo. Sin esto quedaba «Cargando…» para
 * siempre, o un error del servidor se mostraba como «no hay vinculados» (#390).
 */
const LECTURA_VINCULOS: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_VINCULOS: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

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
  /** La lista no se pudo leer: la tabla vacía no significa «no hay vinculados». */
  listaFallo = false;
  /** Descarta respuestas de una lectura anterior (abrir, paginar, tras vincular o desvincular). */
  private lectura = 0;
  /** Página a la vista (la última que respondió bien): a esa se vuelve si falla un cambio de página. */
  private paginaMostrada = { pageIndex: 0, pageSize: 10 };
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
    const lectura = ++this.lectura;
    const fallo = () => {
      if (lectura !== this.lectura) return;
      this.loading = false;
      this.listaFallo = true;
      // El total no se toca (el paginador no colapsa) y se vuelve a la página que está a la vista
      this.pageIndex = this.paginaMostrada.pageIndex;
      this.pageSize = this.paginaMostrada.pageSize;
      this.notificacionService.openWarn(this.dataSource.data.length
        ? 'No se pudo actualizar la lista: puede no reflejar el último cambio. Usá «Reintentar».'
        : 'No se pudo cargar la lista: usá «Reintentar».', 6);
    };
    this.productoProveedorService
      .getByProveedorId(this.proveedor.id, this.searchText || null, this.pageIndex, this.pageSize, undefined, true,
        LECTURA_VINCULOS, CONSULTA_VINCULOS)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          if (lectura !== this.lectura) return;
          if (page == null) {
            fallo();
            return;
          }
          this.loading = false;
          this.listaFallo = false;
          this.paginaMostrada = { pageIndex: this.pageIndex, pageSize: this.pageSize };
          this.totalElements = page.getTotalElements ?? 0;
          const content = page.getContent ?? [];
          const rows: ProductoProveedorProductoRow[] = content.map((pp: ProductoProveedor) => ({
            ...pp,
            productoDescripcionComputed: pp?.producto?.descripcion ?? '',
            productoCodigoComputed: pp?.producto?.codigoPrincipal ?? '',
          }));
          this.dataSource.data = rows;
        },
        error: fallo,
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
        // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom. Se relee igual: sin
        // respuesta pudo haberse vinculado (un reintento respondería «ya vinculado»).
        error: () => this.loadList(),
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
          this.loadList(); // pudo haberse aplicado
        },
      });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
