import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CuentaBancaria } from './cuenta-bancaria.model';
import { CuentaBancariaService } from './cuenta-bancaria.service';
import { AddCuentaBancariaDialogComponent } from './add-cuenta-bancaria-dialog/add-cuenta-bancaria-dialog.component';
import { ListMovimientosBancariosDialogComponent } from '../operacion-financiera/list-movimientos-bancarios-dialog/list-movimientos-bancarios-dialog.component';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { MainService } from '../../../main.service';
import { ROLES } from '../../personas/roles/roles.enum';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-cuenta-bancaria',
  templateUrl: './cuenta-bancaria.component.html',
  styleUrls: ['./cuenta-bancaria.component.scss']
})
export class CuentaBancariaComponent implements OnInit {

  dataSource = new MatTableDataSource<CuentaBancaria>([]);
  isSearching = false;

  // Nota: el backend (cuenta-bancaria.graphqls) todavía no expone saldo/saldoReservado
  // en el tipo CuentaBancaria — ver reporte final. No se agregan esas columnas acá para
  // no pedir campos inexistentes en el schema.
  displayedColumns = ['id', 'nombre', 'numero', 'banco', 'titular', 'moneda', 'tipoCuenta', 'operable', 'acciones'];

  puedeGestionar = false;

  tipoCuentaLabels: Record<string, string> = {
    CUENTA_CORRIENTE: 'Cuenta Corriente',
    CAJA_DE_AHORRO: 'Caja de Ahorro',
  };

  constructor(
    private cuentaBancariaService: CuentaBancariaService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.onFiltrar();
  }

  onFiltrar() {
    this.isSearching = true;
    this.cuentaBancariaService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isSearching = false;
        if (res != null) this.dataSource.data = res;
      });
  }

  onAdd() {
    this.dialog.open(AddCuentaBancariaDialogComponent, {
      width: '550px',
      data: null
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onEdit(item: CuentaBancaria) {
    this.dialog.open(AddCuentaBancariaDialogComponent, {
      width: '550px',
      data: item
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onDelete(item: CuentaBancaria) {
    this.dialogosService.confirm(
      'Eliminar Cuenta Bancaria',
      `¿Está seguro que desea eliminar la cuenta "${item.numero}"?`,
      null, null
    ).subscribe(confirmed => {
      if (confirmed) {
        this.cuentaBancariaService.onDelete(item.id)
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res) {
              this.notificacion.openSucess('Cuenta bancaria eliminada correctamente');
              this.onFiltrar();
            } else {
              this.notificacion.openAlgoSalioMal('No se pudo eliminar la cuenta bancaria');
            }
          });
      }
    });
  }

  onVerMovimientos(item: CuentaBancaria) {
    this.dialog.open(ListMovimientosBancariosDialogComponent, {
      width: '95vw',
      maxWidth: '1200px',
      height: '85vh',
      data: item
    });
  }
}
