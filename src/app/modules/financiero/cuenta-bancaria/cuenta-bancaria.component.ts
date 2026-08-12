import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CuentaBancaria, TipoCuenta } from './cuenta-bancaria.model';
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

  private todas: CuentaBancaria[] = [];
  dataSource = new MatTableDataSource<CuentaBancaria>([]);
  isSearching = false;

  displayedColumns = ['id', 'nombre', 'numero', 'banco', 'titular', 'moneda', 'tipoCuenta', 'operable', 'acciones'];

  // Filtros (client-side; el dataset de cuentas es chico)
  buscarControl = new FormControl('');
  tipoCuentaControl = new FormControl(null);
  operableControl = new FormControl(null);
  activoControl = new FormControl(null);

  tipoCuentaList = [
    { label: 'Cuenta Corriente', value: TipoCuenta.CUENTA_CORRIENTE },
    { label: 'Caja de Ahorro', value: TipoCuenta.CAJA_DE_AHORRO },
  ];

  tipoCuentaLabels: Record<string, string> = {
    CUENTA_CORRIENTE: 'Cuenta Corriente',
    CAJA_DE_AHORRO: 'Caja de Ahorro',
  };

  puedeGestionar = false;

  constructor(
    private cuentaBancariaService: CuentaBancariaService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    public mainService: MainService
  ) { }

  ngOnInit(): void {
    this.puedeGestionar = this.mainService.tieneAlgunRol([ROLES.TESORERIA_GESTIONAR]);
    this.cargar();
  }

  cargar() {
    this.isSearching = true;
    this.cuentaBancariaService.onGetAll()
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isSearching = false;
        this.todas = res || [];
        this.onFiltrar();
      });
  }

  onFiltrar() {
    const texto = (this.buscarControl.value || '').toString().trim().toLowerCase();
    const tipo = this.tipoCuentaControl.value;
    const operable = this.operableControl.value;
    const activo = this.activoControl.value;
    this.dataSource.data = this.todas.filter(c => {
      const matchTexto = !texto
        || [c.nombre, c.numero, c.banco?.nombre, c.titular, c.alias]
             .some(x => (x || '').toString().toLowerCase().includes(texto));
      const matchTipo = tipo == null || c.tipoCuenta === tipo;
      const matchOperable = operable == null || (c.disponibleOperacionesFinancieras !== false) === operable;
      const matchActivo = activo == null || (c.activo !== false) === activo;
      return matchTexto && matchTipo && matchOperable && matchActivo;
    });
  }

  onResetFiltro() {
    this.buscarControl.setValue('');
    this.tipoCuentaControl.setValue(null);
    this.operableControl.setValue(null);
    this.activoControl.setValue(null);
    this.onFiltrar();
  }

  onAdd() {
    this.dialog.open(AddCuentaBancariaDialogComponent, { width: '560px', data: null })
      .afterClosed().subscribe(res => { if (res != null) this.cargar(); });
  }

  onEdit(item: CuentaBancaria) {
    this.dialog.open(AddCuentaBancariaDialogComponent, { width: '560px', data: item })
      .afterClosed().subscribe(res => { if (res != null) this.cargar(); });
  }

  onDelete(item: CuentaBancaria) {
    this.dialogosService.confirm(
      'Eliminar Cuenta Bancaria',
      `¿Está seguro que desea eliminar la cuenta "${item.nombre || item.numero}"?`,
      null, null, true, 'Sí, eliminar', 'No'
    ).subscribe(confirmed => {
      if (confirmed === true) {
        this.cuentaBancariaService.onDelete(item.id)
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res) { this.notificacion.openSucess('Cuenta bancaria eliminada correctamente'); this.cargar(); }
            else this.notificacion.openAlgoSalioMal('No se pudo eliminar la cuenta bancaria');
          });
      }
    });
  }

  onVerMovimientos(item: CuentaBancaria) {
    this.dialog.open(ListMovimientosBancariosDialogComponent, {
      width: '95vw', maxWidth: '1200px', height: '85vh', data: item
    });
  }
}
