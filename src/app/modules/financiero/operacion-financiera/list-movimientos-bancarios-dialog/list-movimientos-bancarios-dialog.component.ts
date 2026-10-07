import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize } from 'rxjs/operators';
import { MovimientoBancario } from '../operacion-financiera.model';
import { OperacionFinancieraService } from '../operacion-financiera.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CuentaBancaria } from '../../cuenta-bancaria/cuenta-bancaria.model';
import { AccionAnularMovimientoBancario, PermisosAnulacionBancaria,
         accionAnularMovimientoBancario } from '../movimiento-bancario-anulacion';
import { MovimientoBancarioAnulacionService } from '../movimiento-bancario-anulacion.service';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';

/** Movimiento con lo que ofrece su menú, precalculado al cargar la página. */
interface MovimientoBancarioRow extends MovimientoBancario {
  _accion: AccionAnularMovimientoBancario;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-movimientos-bancarios-dialog',
  templateUrl: './list-movimientos-bancarios-dialog.component.html',
  styleUrls: ['./list-movimientos-bancarios-dialog.component.scss']
})
export class ListMovimientosBancariosDialogComponent implements OnInit {

  dataSource = new MatTableDataSource<MovimientoBancarioRow>([]);
  /** true si se anuló algo: quien abrió el diálogo lo lee al cerrar para refrescar el saldo de la cuenta. */
  huboCambios = false;
  private permisos: PermisosAnulacionBancaria = { gestionar: false, pagarCpp: false };
  isSearching = false;
  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;

  displayedColumns = ['creadoEn', 'tipoMovimiento', 'monto', 'saldoAnterior', 'saldoPosterior', 'descripcion', 'anulado', 'acciones'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public cuentaBancaria: CuentaBancaria,
    private dialogRef: MatDialogRef<ListMovimientosBancariosDialogComponent>,
    private operacionFinancieraService: OperacionFinancieraService,
    private notificacion: NotificacionSnackbarService,
    private movimientoBancarioAnulacionService: MovimientoBancarioAnulacionService,
    private mainService: MainService,
  ) { }

  ngOnInit(): void {
    this.permisos = {
      gestionar: this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]),
      pagarCpp: this.mainService.tieneAlgunRol([ROLES.TESORERIA_CPP_PAGAR]),
    };
    this.onFiltrar();
  }

  onFiltrar() {
    if (!this.cuentaBancaria?.id) return;
    this.isSearching = true;
    this.operacionFinancieraService.onGetMovimientosBancarios(this.cuentaBancaria.id, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSearching = false;
          if (res == null) { this.notificacion.openWarn('No se pudieron cargar los movimientos de la cuenta.', 5); return; }
          this.totalElements = res.getTotalElements;
          // Clonar: Apollo congela los resultados.
          this.dataSource.data = (res.getContent || []).map(m => (
            { ...m, _accion: accionAnularMovimientoBancario(m, this.permisos) }));
        },
        error: () => {
          this.isSearching = false;
          this.notificacion.openWarn('No se pudieron cargar los movimientos de la cuenta: el servidor no responde.', 5);
        }
      });
  }

  /** No revierte el movimiento suelto: anula el pago o la operación a la que pertenece. */
  onAnular(row: MovimientoBancarioRow) {
    // Sin ESC ni clic afuera mientras corre: si el diálogo se cerrara antes de la respuesta, quien lo
    // abrió leería huboCambios en false y dejaría el saldo viejo en la lista de cuentas.
    this.dialogRef.disableClose = true;
    this.movimientoBancarioAnulacionService.anular(row, row._accion)
      .pipe(finalize(() => this.dialogRef.disableClose = false), untilDestroyed(this))
      .subscribe(hayQueReleer => {
        // También tras un rechazo o un «sin respuesta»: pudo haberse anulado, o la lista estaba vieja.
        if (!hayQueReleer) return;
        this.huboCambios = true;
        // El contra-movimiento entra arriba de todo: se vuelve a la primera página para verlo.
        this.pageIndex = 0;
        this.onFiltrar();
      });
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
}
