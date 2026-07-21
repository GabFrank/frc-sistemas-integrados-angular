import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Justificativo } from '../justificativo.model';
import { JustificativoService } from '../justificativo.service';
import { EditJustificativoDialogComponent } from '../edit-justificativo-dialog/edit-justificativo-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-justificativo',
  templateUrl: './list-justificativo.component.html',
  styleUrls: ['./list-justificativo.component.scss']
})
export class ListJustificativoComponent implements OnInit {

  displayedColumns = ['fecha', 'tipo', 'observacion', 'registradoPor', 'acciones'];
  dataSource = new MatTableDataSource<Justificativo>([]);

  funcionarioControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);


  constructor(
    private justificativoService: JustificativoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(hoy);
  }


  onBuscar() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({
        texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3
      });
      return;
    }
    this.justificativoService.onGetPorFuncionarioYRango(
      this.funcionarioControl.value,
      dateToString(this.desdeControl.value),
      dateToString(this.hastaControl.value)
    ).pipe(untilDestroyed(this)).subscribe(res => {
      this.dataSource.data = res || [];
    });
  }

  onNueva() {
    this.dialog.open(EditJustificativoDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onBuscar();
    });
  }

  onEliminar(n: Justificativo) {
    this.dialogosService.confirm(
      'Eliminar justificativo',
      '¿Desea eliminar este justificativo?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.justificativoService.onDelete(n.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.onBuscar(); });
      }
    });
  }
}
