import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { Prestamo } from '../prestamo.model';
import { PrestamoService } from '../prestamo.service';
import { EditPrestamoDialogComponent } from '../edit-prestamo-dialog/edit-prestamo-dialog.component';
import { PrestamoCuotasDialogComponent } from '../prestamo-cuotas-dialog/prestamo-cuotas-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-prestamo',
  templateUrl: './list-prestamo.component.html',
  styleUrls: ['./list-prestamo.component.scss']
})
export class ListPrestamoComponent implements OnInit {

  displayedColumns = ['fechaInicio', 'descripcion', 'montoTotal', 'montoPagado', 'cantidadCuotas', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Prestamo>([]);

  funcionarioControl = new FormControl(null);

  constructor(
    private prestamoService: PrestamoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
  }


  onBuscar() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.prestamoService.onGetPorFuncionario(this.funcionarioControl.value)
      .pipe(untilDestroyed(this)).subscribe(res => { this.dataSource.data = res || []; });
  }

  onNuevo() {
    this.dialog.open(EditPrestamoDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscar(); });
  }

  onVerCuotas(prestamo: Prestamo) {
    this.dialog.open(PrestamoCuotasDialogComponent, { data: { prestamo }, width: '640px', disableClose: false })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => { this.onBuscar(); });
  }
}
