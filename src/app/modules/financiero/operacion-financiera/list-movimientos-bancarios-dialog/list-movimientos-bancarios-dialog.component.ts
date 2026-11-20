import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { PaginacionLista } from '../../../../shared/components/paginacion/paginacion-lista';
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

  /** Movimientos de la cuenta paginados en el central (#772): si una página falla, vuelve a la anterior. */
  pag: PaginacionLista<MovimientoBancarioRow> = new PaginacionLista<MovimientoBancarioRow>({
    cargar: (page, size) => this.operacionFinancieraService.onGetMovimientosBancarios(this.cuentaBancaria.id, page, size).pipe(
      map(res => {
        if (res == null) {
          this.notificacion.openWarn('No se pudieron cargar los movimientos de la cuenta.', 5);
          return null;
        }
        // Clonar: Apollo congela los resultados.
        return {
          getTotalElements: res.getTotalElements,
          getContent: (res.getContent || []).map(m => ({ ...m, _accion: accionAnularMovimientoBancario(m, this.permisos) })),
        };
      }),
      catchError(() => {
        this.notificacion.openWarn('No se pudieron cargar los movimientos de la cuenta: el servidor no responde.', 5);
        return of(null);
      })
    ),
    pageSize: 20,
    pageSizeOptions: [10, 20, 50],
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });

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
    this.pag.filtrar();
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
        this.pag.irAPrimera();
      });
  }
}
