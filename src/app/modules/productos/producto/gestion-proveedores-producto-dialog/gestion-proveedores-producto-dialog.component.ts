import {
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Producto } from '../producto.model';
import { ProductoProveedor } from '../../producto-proveedor/producto-proveedor.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { ProductoProveedorService } from '../../producto-proveedor/producto-proveedor.service';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { DesvincularProductoProveedorGQL } from '../../producto-proveedor/graphql/desvincularProductoProveedor';
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

export interface GestionProveedoresProductoDialogData {
  producto: Producto;
}

export interface ProductoProveedorRow extends ProductoProveedor {
  proveedorNombreComputed: string;
}

const MOTIVOS_DESVINCULAR = [
  { value: 'PROVEEDOR YA NO POSEE EL PRODUCTO', label: 'Proveedor ya no posee el producto' },
  { value: 'PRECIO INCOMPETENTE', label: 'Precio incompetente' },
  { value: 'MALA CALIDAD DE ENTREGA', label: 'Mala calidad de entrega' },
  { value: 'PRODUCTO YA NO EXISTE', label: 'Producto ya no existe' },
];

@Component({
  selector: 'app-gestion-proveedores-producto-dialog',
  templateUrl: './gestion-proveedores-producto-dialog.component.html',
  styleUrls: ['./gestion-proveedores-producto-dialog.component.scss'],
})
export class GestionProveedoresProductoDialogComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  private destroy$ = new Subject<void>();

  producto: Producto;
  headerDescripcionComputed = '';
  headerCodigoComputed = '';

  proveedorControl = new FormControl(null);
  selectedProveedorComputed: Proveedor | null = null;
  addButtonDisabledComputed = true;

  dataSource = new MatTableDataSource<ProductoProveedorRow>([]);
  displayedColumns: string[] = ['id', 'proveedor', 'acciones'];
  loading = false;
  /** La lista no se pudo leer: la tabla vacía no significa «no hay vinculados». */
  listaFallo = false;
  /** Descarta respuestas de una lectura anterior (abrir, paginar, tras vincular o desvincular). */
  private lectura = 0;
  /** Página a la vista (la última que respondió bien): a esa se vuelve si falla un cambio de página. */
  private paginaMostrada = { pageIndex: 0, pageSize: 10 };
  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;

  motivosDesvincularComputed = MOTIVOS_DESVINCULAR;

  constructor(
    public dialogRef: MatDialogRef<GestionProveedoresProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionProveedoresProductoDialogData,
    private productoProveedorService: ProductoProveedorService,
    private proveedorService: ProveedorService,
    private desvincularProductoProveedorGQL: DesvincularProductoProveedorGQL,
    private notificacionService: NotificacionSnackbarService
  ) {
    this.producto = data?.producto || null;
  }

  ngOnInit(): void {
    this.updateHeaderComputed();
    this.loadList();
    this.proveedorControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.selectedProveedorComputed = value && value.id != null ? value : null;
        this.addButtonDisabledComputed = this.selectedProveedorComputed == null;
      });
  }

  private updateHeaderComputed(): void {
    this.headerDescripcionComputed = this.producto?.descripcion ?? '';
    this.headerCodigoComputed = this.producto?.codigoPrincipal ?? '';
  }

  loadList(): void {
    if (!this.producto?.id) return;
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
      .getByProductoId(this.producto.id, this.pageIndex, this.pageSize, true, LECTURA_VINCULOS, CONSULTA_VINCULOS)
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
          const rows: ProductoProveedorRow[] = content.map((pp: ProductoProveedor) => ({
            ...pp,
            proveedorNombreComputed: pp?.proveedor?.persona?.nombre ?? '',
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

  onBuscarProveedor(): void {
    this.proveedorService
      .onSearchProveedorPorTexto(this.proveedorControl.value?.nombre ?? this.proveedorControl.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe((proveedor: Proveedor) => {
        if (proveedor) {
          this.proveedorControl.setValue(proveedor);
          this.selectedProveedorComputed = proveedor;
          this.addButtonDisabledComputed = false;
        }
      });
  }

  onRemoverProveedor(): void {
    this.proveedorControl.setValue(null);
    this.selectedProveedorComputed = null;
    this.addButtonDisabledComputed = true;
  }

  onAdicionarProveedor(): void {
    if (!this.selectedProveedorComputed?.id || !this.producto?.id) return;
    this.productoProveedorService
      .saveProductoProveedor({
        productoId: this.producto.id,
        proveedorId: this.selectedProveedorComputed.id,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.onRemoverProveedor();
          this.loadList();
        },
        // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom. Se relee igual: sin
        // respuesta pudo haberse vinculado (un reintento respondería «ya vinculado»).
        error: () => this.loadList(),
      });
  }

  onDesvincular(row: ProductoProveedorRow, motivo: string): void {
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
            this.notificacionService.openSucess('Proveedor desvinculado correctamente');
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
