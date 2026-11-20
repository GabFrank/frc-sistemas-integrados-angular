import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
import { SolicitudPagoService } from '../../compra/gestion-compras/solicitud-pago.service';
import { NotaRecepcion } from '../../compra/gestion-compras/nota-recepcion.model';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

export interface AdicionarNotaDialogData {
  proveedorId: number;
  notasYaAgregadasIds: number[];
}

@Component({
  selector: 'app-adicionar-nota-dialog',
  templateUrl: './adicionar-nota-dialog.component.html',
  styleUrls: ['./adicionar-nota-dialog.component.scss']
})
export class AdicionarNotaDialogComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['select', 'proveedor', 'numero', 'fecha', 'moneda', 'valorTotal'];
  dataSource = new MatTableDataSource<(NotaRecepcion & { proveedorNombreDisplay?: string })>([]);

  /** Símbolo a mostrar para una nota — moneda propia, fallback Gs. */
  getSimbolo(nota: NotaRecepcion): string {
    const m: any = (nota as any).moneda;
    if (m?.simbolo) return m.simbolo;
    const denom = (m?.denominacion || '').toString().toUpperCase();
    return denom.includes('GUARANI') || denom === 'GS' ? 'Gs.' : '';
  }

  /** Formato Angular `number` pipe — Gs sin decimales, otras con dos. */
  getDecimalFormat(nota: NotaRecepcion): string {
    const denom = ((nota as any).moneda?.denominacion || '').toString().toUpperCase();
    return denom.includes('GUARANI') || denom === 'GS' ? '1.0-0' : '1.0-2';
  }

  /** Denominación a mostrar en columna moneda. */
  getDenominacion(nota: NotaRecepcion): string {
    return ((nota as any).moneda?.denominacion || '-').toString().toUpperCase();
  }
  filtroTexto = '';

  /** Notas paginadas en el central (#772): gana la última página pedida; si falla una página vuelve a la anterior. */
  pag = new PaginacionLista<NotaRecepcion>({
    cargar: (page, size) => this.solicitudPagoService.onGetNotasDisponiblesParaPagoPorProveedorPaginated(
      this.data.proveedorId, page, size, this.filtroTexto.trim() || undefined),
    pageSize: 10,
    pageSizeOptions: [10, 20, 30],
    alCargar: (res) => this.mostrarNotas(res.getContent || []),
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) {
        // Sin filas de otro filtro a la vista (#390)
        this.dataSource.data = [];
        this.updateComputedProperties();
      }
      this.notificacionService.openWarn('No se pudieron cargar las notas disponibles: el servidor no responde. Intentá de nuevo.', 6);
    },
  });
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

  ngOnDestroy(): void {
    this.pag.unsubscribe();
  }

  loadPage(): void {
    if (!this.data?.proveedorId) return;
    this.pag.recargar();
  }

  private mostrarNotas(notas: NotaRecepcion[]): void {
    const idsAgregados = new Set(this.data.notasYaAgregadasIds || []);
    const content = notas.filter((n) => !idsAgregados.has(n.id));
    content.forEach((n) => {
      (n as NotaRecepcion & { proveedorNombreDisplay?: string }).proveedorNombreDisplay =
        (n.pedido?.proveedor?.persona?.nombre ?? '').toString().toUpperCase();
    });
    this.dataSource.data = content as (NotaRecepcion & { proveedorNombreDisplay?: string })[];
    this.updateComputedProperties();
  }

  onFiltroBuscar(): void {
    if (!this.data?.proveedorId) return;
    this.pag.filtrar();
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
