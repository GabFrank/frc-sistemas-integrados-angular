import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { NotaRecepcion } from '../../compra/gestion-compras/nota-recepcion.model';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { NotaRecepcionPageResult } from '../../compra/gestion-compras/graphql/getNotasDisponiblesParaPagoPorProveedorPaginated';

export interface AdicionarNotaDialogData {
  proveedorId: number;
  notasYaAgregadasIds: number[];
}

@Component({
  selector: 'app-adicionar-nota-dialog',
  templateUrl: './adicionar-nota-dialog.component.html',
  styleUrls: ['./adicionar-nota-dialog.component.scss']
})
export class AdicionarNotaDialogComponent implements OnInit {
  displayedColumns: string[] = ['select', 'proveedor', 'numero', 'fecha', 'valorTotal'];
  dataSource = new MatTableDataSource<(NotaRecepcion & { proveedorNombreDisplay?: string })>([]);
  loading = true;
  filtroTexto = '';
  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;
  /** IDs de notas seleccionadas (multi-select). */
  selectedNotas: Set<number> = new Set();
  /** Objetos completos de notas seleccionadas (para devolver al cerrar; se mantienen al cambiar de página). */
  selectedNotasList: NotaRecepcion[] = [];
  /** Mapa id -> true para binding en template (evitar funciones en template). */
  selectedIdsMap: Record<number, boolean> = {};
  /** Todas las filas de la página actual están seleccionadas (para checkbox de cabecera). */
  allSelectedOnPage = false;

  constructor(
    private dialogRef: MatDialogRef<AdicionarNotaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdicionarNotaDialogData,
    private solicitudPagoService: SolicitudPagoService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    if (!this.data?.proveedorId) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.solicitudPagoService
      .onGetNotasDisponiblesParaPagoPorProveedorPaginated(
        this.data.proveedorId,
        this.pageIndex,
        this.pageSize,
        this.filtroTexto.trim() || undefined
      )
      .subscribe({
        next: (result: NotaRecepcionPageResult) => {
          const idsAgregados = new Set(this.data.notasYaAgregadasIds || []);
          const content = (result?.getContent || []).filter((n) => !idsAgregados.has(n.id));
          content.forEach((n) => {
            (n as NotaRecepcion & { proveedorNombreDisplay?: string }).proveedorNombreDisplay =
              (n.pedido?.proveedor?.persona?.nombre ?? '').toString().toUpperCase();
          });
          this.dataSource.data = content as (NotaRecepcion & { proveedorNombreDisplay?: string })[];
          this.totalElements = result?.getTotalElements ?? 0;
          this.loading = false;
          this.updateComputedProperties();
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal('Error al cargar notas');
          this.loading = false;
        }
      });
  }

  onFiltroBuscar(): void {
    this.pageIndex = 0;
    this.loadPage();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPage();
  }

  updateComputedProperties(): void {
    this.selectedIdsMap = {};
    this.selectedNotas.forEach((id) => (this.selectedIdsMap[id] = true));
    const rows = this.dataSource.data;
    this.allSelectedOnPage =
      rows.length > 0 && rows.every((r) => this.selectedNotas.has(r.id));
  }

  toggleNota(nota: NotaRecepcion): void {
    if (this.selectedNotas.has(nota.id)) {
      this.selectedNotas.delete(nota.id);
      this.selectedNotasList = this.selectedNotasList.filter((n) => n.id !== nota.id);
    } else {
      this.selectedNotas.add(nota.id);
      this.selectedNotasList = [...this.selectedNotasList, nota];
    }
    this.selectedNotas = new Set(this.selectedNotas);
    this.updateComputedProperties();
  }

  toggleAllOnPage(): void {
    const rows = this.dataSource.data;
    if (this.allSelectedOnPage) {
      rows.forEach((r) => {
        this.selectedNotas.delete(r.id);
        this.selectedNotasList = this.selectedNotasList.filter((n) => n.id !== r.id);
      });
    } else {
      rows.forEach((r) => {
        if (!this.selectedNotas.has(r.id)) {
          this.selectedNotas.add(r.id);
          this.selectedNotasList = [...this.selectedNotasList, r];
        }
      });
    }
    this.selectedNotas = new Set(this.selectedNotas);
    this.updateComputedProperties();
  }

  onAdicionarSeleccionadas(): void {
    const list = this.selectedNotasList;
    if (list.length === 0) {
      this.notificacionService.openWarn('Seleccione al menos una nota');
      return;
    }
    this.dialogRef.close(list);
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }
}
