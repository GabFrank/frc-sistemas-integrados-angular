import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OperacionFinanciera } from '../operacion-financiera.model';
import { OperacionFinancieraService } from '../operacion-financiera.service';
import { AddOperacionFinancieraDialogComponent } from '../add-operacion-financiera-dialog/add-operacion-financiera-dialog.component';
import { Tab } from '../../../../layouts/tab/tab.model';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { OperacionFinancieraDetalleDialogComponent } from '../operacion-financiera-detalle-dialog/operacion-financiera-detalle-dialog.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-operacion-financiera',
  templateUrl: './list-operacion-financiera.component.html',
  styleUrls: ['./list-operacion-financiera.component.scss']
})
export class ListOperacionFinancieraComponent implements OnInit {

  @Input() data: Tab;

  // Filas de display: la entidad + origenLabel/destinoLabel precalculados (any porque
  // el spread pierde el toInput() de la clase; es solo para la tabla, no se guarda).
  dataSource = new MatTableDataSource<any>([]);
  isSearching = false;
  pageIndex = 0;
  pageSize = 10;
  totalElements = 0;

  puedeGestionar = false;

  tipoOperacionLabels: Record<string, string> = {
    CAMBIO_DIVISA: 'Cambio de Divisa',
    DEPOSITO_BANCARIO: 'Depósito Bancario',
    RETIRO_BANCARIO: 'Retiro Bancario',
    TRANSFERENCIA_ENTRE_CAJAS: 'Transferencia entre Cajas',
    TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria',
  };

  displayedColumns = ['creadoEn', 'tipoOperacion', 'origen', 'destino', 'montoOrigen', 'montoDestino', 'descripcion', 'anulado', 'acciones'];

  constructor(
    private operacionFinancieraService: OperacionFinancieraService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.onFiltrar();
  }

  onFiltrar() {
    this.isSearching = true;
    this.operacionFinancieraService.onGetOperaciones(this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isSearching = false;
        if (res != null) {
          this.totalElements = res.getTotalElements;
          // Etiquetas de origen/destino pre-calculadas al cargar — evita llamar
          // funciones desde el HTML en cada fila.
          this.dataSource.data = (res.getContent || []).map(op => ({
            ...op,
            origenLabel: op.cajaMayorOrigen?.nombre
              || (op.cuentaBancariaOrigen ? `${op.cuentaBancariaOrigen.banco?.nombre} ${op.cuentaBancariaOrigen.numero}` : '-'),
            destinoLabel: op.cajaMayorDestino?.nombre
              || (op.cuentaBancariaDestino ? `${op.cuentaBancariaDestino.banco?.nombre} ${op.cuentaBancariaDestino.numero}` : '-'),
          }));
        }
      });
  }

  onAdd() {
    this.dialog.open(AddOperacionFinancieraDialogComponent, {
      width: '880px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      data: null
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  /**
   * Anula la operación completa desde acá.
   *
   * El otro camino es el historial de la caja mayor, pero ese solo existe si la operación
   * dejó un movimiento de caja: una transferencia bancaria, o un cambio de divisa entre dos
   * cuentas, no tienen fila ahí y quedaban sin forma de anularse desde la aplicación.
   * La operación es la unidad que el usuario reconoce, y anularla revierte todas sus patas.
   */
  onAnular(row: any) {
    if (!row?.id || row.anulado) return;
    const tipo = this.tipoOperacionLabels[row.tipoOperacion] || 'la operación';
    this.dialogosService.confirm(
      'Anular operación financiera',
      `¿Anular ${tipo} #${row.id}?`,
      'Se revierten todos sus movimientos (caja y banco) con un contra-asiento. El original no se borra.',
      null, true, 'Sí, anular', 'No',
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      this.operacionFinancieraService.onAnular(row.id)
        .pipe(untilDestroyed(this)).subscribe({
          next: r => {
            if (r == null) return;
            this.notificacion.notification$.next({
              texto: 'Operación financiera anulada',
              color: NotificacionColor.success, duracion: 3,
            });
            this.onFiltrar();
          },
          // El mensaje del backend ya lo muestra GenericCrudService.
          error: () => {},
        });
    });
  }

  /** Detalle read-only: los montos, la cotización y las dos patas de la operación. */
  onVerDetalle(row: any) {
    this.dialog.open(OperacionFinancieraDetalleDialogComponent, {
      width: '720px', maxWidth: '95vw', data: { operacionId: row.id },
    });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
}
