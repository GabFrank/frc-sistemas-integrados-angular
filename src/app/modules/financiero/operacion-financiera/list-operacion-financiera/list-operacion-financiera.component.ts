import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
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
  /** Operaciones paginadas en el central (#772): gana la última página pedida; si falla, vuelve a la anterior. */
  pag: PaginacionLista<any> = new PaginacionLista<any>({
    cargar: (page, size) => this.operacionFinancieraService.onGetOperaciones(page, size).pipe(
      map(res => {
        if (res == null) {
          this.notificacion.openWarn('No se pudieron cargar las operaciones financieras.', 5);
          return null;
        }
        // Etiquetas de origen/destino pre-calculadas al cargar — evita llamar
        // funciones desde el HTML en cada fila.
        return {
          getTotalElements: res.getTotalElements,
          getContent: (res.getContent || []).map(op => ({
            ...op,
            origenLabel: op.cajaMayorOrigen?.nombre
              || (op.cuentaBancariaOrigen ? `${op.cuentaBancariaOrigen.banco?.nombre} ${op.cuentaBancariaOrigen.numero}` : '-'),
            destinoLabel: op.cajaMayorDestino?.nombre
              || (op.cuentaBancariaDestino ? `${op.cuentaBancariaDestino.banco?.nombre} ${op.cuentaBancariaDestino.numero}` : '-'),
          })),
        };
      }),
      catchError(() => {
        this.notificacion.openWarn('No se pudieron cargar las operaciones financieras: el servidor no responde.', 5);
        return of(null);
      })
    ),
    pageSize: 10,
    pageSizeOptions: [10, 20, 50],
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });

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
    this.pag.filtrar();
  }

  onAdd() {
    this.dialog.open(AddOperacionFinancieraDialogComponent, {
      width: '880px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      data: null
    }).afterClosed().subscribe(res => {
      if (res == null) return;
      // La operación nueva (o la que pudo haberse registrado) queda arriba de todo: se vuelve a la primera página.
      this.pag.irAPrimera();
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
      this.operacionFinancieraService.onAnular(row.id, undefined, { avisarExito: false })
        .pipe(untilDestroyed(this)).subscribe({
          next: r => {
            if (r == null) {
              this.notificacion.openWarn('No se pudo confirmar la anulación: se vuelve a leer para verificarla.', 6);
            } else {
              this.notificacion.notification$.next({
                texto: 'Operación financiera anulada',
                color: NotificacionColor.success, duracion: 3,
              });
            }
            this.pag.recargar();
          },
          // El mensaje ya lo muestra GenericCrudService. Se relee igual: un rechazo «ya está
          // anulada» es una lista vieja, y sin respuesta la anulación pudo haberse aplicado (#390).
          error: () => this.pag.recargar(),
        });
    });
  }

  /** Detalle read-only: los montos, la cotización y las dos patas de la operación. */
  onVerDetalle(row: any) {
    this.dialog.open(OperacionFinancieraDetalleDialogComponent, {
      width: '720px', maxWidth: '95vw', data: { operacionId: row.id },
    });
  }
}
