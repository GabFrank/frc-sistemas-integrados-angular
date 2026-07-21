import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LiquidacionSueldo } from '../liquidacion.model';
import { LiquidacionService } from '../liquidacion.service';
import { GenerarLiquidacionDialogComponent } from '../generar-liquidacion-dialog/generar-liquidacion-dialog.component';
import { LiquidacionDetalleDialogComponent } from '../liquidacion-detalle-dialog/liquidacion-detalle-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-liquidacion',
  templateUrl: './list-liquidacion.component.html',
  styleUrls: ['./list-liquidacion.component.scss']
})
export class ListLiquidacionComponent implements OnInit {

  displayedColumns = ['periodo', 'funcionario', 'totalHaberes', 'totalDescuentos', 'totalNeto', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<LiquidacionSueldo>([]);

  funcionarioControl = new FormControl(null);
  periodoControl = new FormControl(null);

  constructor(
    private liquidacionService: LiquidacionService,
    public mainService: MainService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.periodoControl.setValue(hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2));
  }


  onBuscarPorFuncionario() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.liquidacionService.onGetPorFuncionario(this.funcionarioControl.value)
      .pipe(untilDestroyed(this)).subscribe(res => { this.dataSource.data = res || []; });
  }

  onBuscarPorPeriodo() {
    if (!this.periodoControl.value) { return; }
    this.liquidacionService.onGetPorPeriodo(this.periodoControl.value)
      .pipe(untilDestroyed(this)).subscribe(res => { this.dataSource.data = res || []; });
  }

  onNueva() {
    this.dialog.open(GenerarLiquidacionDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value, periodo: this.periodoControl.value },
      width: '480px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscarPorPeriodo(); });
  }

  onGenerarMes() {
    if (!this.periodoControl.value) { return; }
    this.liquidacionService.onGenerarMes(this.periodoControl.value, null)
      .pipe(untilDestroyed(this)).subscribe((cant: number) => {
        this.notificacion.notification$.next({ texto: 'Borradores generados: ' + (cant ?? 0), color: NotificacionColor.success, duracion: 3 });
        this.onBuscarPorPeriodo();
      });
  }

  onDetalle(liq: LiquidacionSueldo) {
    this.dialog.open(LiquidacionDetalleDialogComponent, { data: { liquidacion: liq }, width: '820px', disableClose: false })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
        if (this.funcionarioControl.value) { this.onBuscarPorFuncionario(); } else { this.onBuscarPorPeriodo(); }
      });
  }
}
