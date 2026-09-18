import { Component, OnInit, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { NotaRemision, OrigenNotaRemision } from '../nota-remision.model';
import { NotaRemisionService } from '../nota-remision.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { AddNotaRemisionDialogComponent } from '../add-nota-remision-dialog/add-nota-remision-dialog.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

/**
 * Lista de notas de remisión electrónicas. Todo va contra el central.
 *
 * Los permisos se calculan una vez en ngOnInit y quedan en flags: llamar funciones desde el HTML
 * las re-evalúa en cada ciclo de detección de cambios (regla del repo).
 */
@UntilDestroy()
@Component({
  selector: 'app-list-nota-remision',
  templateUrl: './list-nota-remision.component.html',
  styleUrls: ['./list-nota-remision.component.scss']
})
export class ListNotaRemisionComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<NotaRemision>([]);
  displayedColumns = ['numero', 'fecha', 'origen', 'receptor', 'vehiculo', 'chofer', 'estadoDe', 'acciones'];

  sucursalIdControl = new FormControl(null);
  fechaDesdeControl = new FormControl(null);
  fechaHastaControl = new FormControl(null);

  sucursales: Sucursal[] = [];
  selectedPageInfo: PageInfo<NotaRemision>;
  pageIndex = 0;
  pageSize = 15;

  /** Estado del documento electrónico por nota, para el chip y los botones. */
  estadoDePorNota: { [notaId: number]: string } = {};
  cdcPorNota: { [notaId: number]: string } = {};

  puedeEmitir = false;
  puedeAnular = false;

  constructor(
    private service: NotaRemisionService,
    private sucursalService: SucursalService,
    private mainService: MainService,
    private dialogosService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private impresionService: ImpresionService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.puedeEmitir = this.mainService.tieneAlgunRol([ROLES.FACTURACION_NR_EMITIR, ROLES.ADMIN]);
    this.puedeAnular = this.mainService.tieneAlgunRol([ROLES.FACTURACION_ANULAR, ROLES.ADMIN]);

    this.sucursalService.onGetAllSucursales(true).pipe(untilDestroyed(this)).subscribe(res => {
      this.sucursales = res ?? [];
    });

    this.sucursalIdControl.setValue(this.mainService.sucursalActual?.id ?? null);
    this.buscar();
  }

  buscar(): void {
    this.service.onGetPorFiltro(
      this.sucursalIdControl.value,
      this.fechaDesdeControl.value ? dateToString(this.fechaDesdeControl.value) : null,
      this.fechaHastaControl.value ? dateToString(this.fechaHastaControl.value) : null,
      this.pageIndex,
      this.pageSize
    ).pipe(untilDestroyed(this)).subscribe(res => {
      this.selectedPageInfo = res;
      this.dataSource.data = res?.getContent ?? [];
      this.cargarEstados();
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.buscar();
  }

  onNueva(): void {
    this.dialog.open(AddNotaRemisionDialogComponent, {
      width: '95%', maxWidth: '1200px', data: { origen: OrigenNotaRemision.MANUAL }
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) this.buscar();
    });
  }

  onEnviar(nota: NotaRemision): void {
    this.service.onGenerarYEnviar(nota.id, nota.sucursalId).pipe(untilDestroyed(this)).subscribe(de => {
      if (de) {
        this.notificacionService.openSucess(`Enviada a SIFEN. CDC ${de.cdc}`, 5);
        this.buscar();
      }
    });
  }

  onReenviar(nota: NotaRemision): void {
    this.service.onReenviar(nota.id, nota.sucursalId).pipe(untilDestroyed(this)).subscribe(() => this.buscar());
  }

  onImprimir(nota: NotaRemision): void {
    // soloPdf: el ticket térmico de la nota no entra en esta entrega (el backend lo rechaza).
    this.impresionService.imprimir(
      'Nota de remisión',
      () => this.service.onImprimir(nota.id, nota.sucursalId),
      true
    );
  }

  onAnular(nota: NotaRemision): void {
    this.dialogosService.confirm(
      'Anular nota de remisión',
      `Se va a cancelar ante SIFEN la nota ${this.numeroFormateado(nota)}.`,
      '¿Confirmás?'
    ).pipe(untilDestroyed(this)).subscribe(confirmado => {
      if (confirmado) {
        this.service.onAnular(nota.id, nota.sucursalId).pipe(untilDestroyed(this)).subscribe(() => this.buscar());
      }
    });
  }

  numeroFormateado(nota: NotaRemision): string {
    if (!nota?.numeroNotaRemision) return '';
    return `001-001-${String(nota.numeroNotaRemision).padStart(7, '0')}`;
  }

  /**
   * Reenviar tiene sentido mientras SIFEN no lo aprobó: un envío fallido deja el documento en
   * EN_LOTE, no en PENDIENTE (hallazgo B2 de la auditoría).
   */
  private cargarEstados(): void {
    (this.dataSource.data ?? []).forEach(nota => {
      this.service.onGetDocumentoElectronico(nota.id, nota.sucursalId)
        .pipe(untilDestroyed(this))
        .subscribe(de => {
          this.estadoDePorNota[nota.id] = de?.estado ?? 'SIN ENVIAR';
          this.cdcPorNota[nota.id] = de?.cdc ?? '';
        });
    });
  }
}
