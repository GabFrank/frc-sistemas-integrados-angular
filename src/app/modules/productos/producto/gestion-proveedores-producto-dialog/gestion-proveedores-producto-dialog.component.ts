import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { Producto } from '../producto.model';
import { ProductoProveedor } from '../../producto-proveedor/producto-proveedor.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { ProductoProveedorService } from '../../producto-proveedor/producto-proveedor.service';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { map, takeUntil } from 'rxjs/operators';
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
import { avisoTrasMutacion, erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';

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
export class GestionProveedoresProductoDialogComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  producto: Producto;
  headerDescripcionComputed = '';
  headerCodigoComputed = '';

  proveedorControl = new FormControl(null);
  selectedProveedorComputed: Proveedor | null = null;
  addButtonDisabledComputed = true;

  displayedColumns: string[] = ['id', 'proveedor', 'acciones'];

  /** Proveedores vinculados, paginados en el central (#772): descarta lecturas viejas y si falla vuelve a la página anterior. */
  pag: PaginacionLista<ProductoProveedorRow> = new PaginacionLista<ProductoProveedorRow>({
    cargar: (page, size) => this.productoProveedorService
      .getByProductoId(this.producto.id, page, size, true, LECTURA_VINCULOS, CONSULTA_VINCULOS)
      .pipe(map(pagina => pagina && {
        getTotalElements: pagina.getTotalElements ?? 0,
        getContent: (pagina.getContent ?? []).map((pp: ProductoProveedor) => ({
          ...pp,
          proveedorNombreComputed: pp?.proveedor?.persona?.nombre ?? '',
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
    public dialogRef: MatDialogRef<GestionProveedoresProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GestionProveedoresProductoDialogData,
    private productoProveedorService: ProductoProveedorService,
    private proveedorService: ProveedorService,
    private notificacionService: NotificacionSnackbarService
  ) {
    this.producto = data?.producto || null;
  }

  ngOnInit(): void {
    this.updateHeaderComputed();
    if (this.producto?.id) this.pag.filtrar();
    this.proveedorControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.selectedProveedorComputed = value && value.id != null ? value : null;
        this.addButtonDisabledComputed = this.selectedProveedorComputed == null;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pag.unsubscribe();
  }

  private updateHeaderComputed(): void {
    this.headerDescripcionComputed = this.producto?.descripcion ?? '';
    this.headerCodigoComputed = this.producto?.codigoPrincipal ?? '';
  }

  /** Repite la página actual (Reintentar, después de vincular o desvincular). */
  loadList(): void {
    if (!this.producto?.id) return;
    this.pag.recargar();
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
    this.productoProveedorService
      .onDesvincular(row.id, motivo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vinculo) => {
          if (vinculo) {
            this.notificacionService.openSucess('Proveedor desvinculado correctamente');
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
