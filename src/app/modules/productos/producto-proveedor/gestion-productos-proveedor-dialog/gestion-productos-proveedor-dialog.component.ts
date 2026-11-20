import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Producto } from '../../producto/producto.model';
import { ProductoProveedor } from '../producto-proveedor.model';
import { ProductoProveedorService } from '../producto-proveedor.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { map, takeUntil } from 'rxjs/operators';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { ContextoConsulta, QueryError } from '../../../../generics/generic-crud.service';
import { TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.constantes';

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
import { avisoTrasMutacion, erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';

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
export class GestionProductosProveedorDialogComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  proveedor: Proveedor;
  headerNombreComputed = '';
  headerDocumentoComputed = '';
  documentoConDigitoVerificadorComputed = '';

  selectedProductoComputed: Producto | null = null;
  addButtonDisabledComputed = true;
  selectedProductoDisplayComputed = '';

  displayedColumns: string[] = ['id', 'descripcion', 'codigo', 'acciones'];
  searchText = '';

  /** Productos vinculados, paginados en el central (#772): descarta lecturas viejas y si falla vuelve a la página anterior. */
  pag: PaginacionLista<ProductoProveedorProductoRow> = new PaginacionLista<ProductoProveedorProductoRow>({
    cargar: (page, size) => this.productoProveedorService
      .getByProveedorId(this.proveedor.id, this.searchText || null, page, size, undefined, true,
        LECTURA_VINCULOS, CONSULTA_VINCULOS)
      .pipe(map(pagina => pagina && {
        getTotalElements: pagina.getTotalElements ?? 0,
        getContent: (pagina.getContent ?? []).map((pp: ProductoProveedor) => ({
          ...pp,
          productoDescripcionComputed: pp?.producto?.descripcion ?? '',
          productoCodigoComputed: pp?.producto?.codigoPrincipal ?? '',
        })),
      })),
    pageSize: 10,
    pageSizeOptions: [5, 10, 25],
    alFallar: () => this.notificacionService.openWarn(this.pag.items.length
      ? 'No se pudo actualizar la lista: puede no reflejar el último cambio. Usá «Reintentar».'
      : 'No se pudo cargar la lista: usá «Reintentar».', 6),
  });

  motivosDesvincularComputed = MOTIVOS_DESVINCULAR;

  constructor(
    public dialogRef: MatDialogRef<GestionProductosProveedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionProductosProveedorDialogData,
    private productoProveedorService: ProductoProveedorService,
    private notificacionService: NotificacionSnackbarService,
    private matDialog: MatDialog,
    private searchProductoWithFiltersGQL: SearchProductoWithFiltersGQL
  ) {
    this.proveedor = data?.proveedor || null;
  }

  ngOnInit(): void {
    this.updateHeaderComputed();
    if (this.proveedor?.id) this.pag.filtrar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pag.unsubscribe();
  }

  private updateHeaderComputed(): void {
    this.headerNombreComputed = this.proveedor?.persona?.nombre ?? '';
    const doc = this.proveedor?.persona?.documento ?? '';
    this.headerDocumentoComputed = doc;
    this.documentoConDigitoVerificadorComputed =
      doc.length >= 5 ? doc + getDigitoVerificadorString(doc) : doc;
  }

  /** Repite la página actual (Reintentar, después de vincular o desvincular). */
  loadList(): void {
    if (!this.proveedor?.id) return;
    this.pag.recargar();
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
    this.productoProveedorService
      .onDesvincular(row.id, motivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vinculo) => {
          if (vinculo) {
            this.notificacionService.openSucess('Producto desvinculado correctamente');
          } else {
            // Defensivo: un vínculo inexistente llega como rechazo (el «Ups!» del genérico), no como null (#501)
            this.notificacionService.openWarn('No se pudo desvincular: no se encontró el vínculo.');
          }
          this.loadList();
        },
        // Antes «Error al desvincular» en rechazo y en corte por igual. En un rechazo el genérico ya mostró el motivo;
        // sin respuesta pudo aplicarse: se avisa (el corte por tiempo ya lo avisó el link) y se relee (#501)
        error: (error) => {
          const aviso = erroresDeRechazo(error) == null ? avisoTrasMutacion(error, 'se desvinculó') : null;
          if (aviso != null) {
            this.notificacionService.openWarn(aviso, 8);
          }
          this.loadList();
        },
      });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
