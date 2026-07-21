import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Vale } from '../vale.model';
import { ValeService } from '../vale.service';
import { EditValeDialogComponent } from '../edit-vale-dialog/edit-vale-dialog.component';
import { ConfirmarValeDialogComponent } from '../confirmar-vale-dialog/confirmar-vale-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-vale',
  templateUrl: './list-vale.component.html',
  styleUrls: ['./list-vale.component.scss']
})
export class ListValeComponent implements OnInit {

  displayedColumns = ['fecha', 'motivo', 'monto', 'moneda', 'esAdelanto', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Vale>([]);

  funcionarioControl = new FormControl(null);

  constructor(
    private valeService: ValeService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
  }


  onBuscar() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.valeService.onGetPorFuncionario(this.funcionarioControl.value)
      .pipe(untilDestroyed(this)).subscribe(res => { this.dataSource.data = res || []; });
  }

  onNuevo() {
    this.dialog.open(EditValeDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscar(); });
  }

  onConfirmar(vale: Vale) {
    this.dialog.open(ConfirmarValeDialogComponent, { data: { vale }, width: '480px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscar(); });
  }

  onAnular(vale: Vale) {
    this.dialogosService.confirm(
      'Anular vale', '¿Desea anular este vale?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.valeService.onAnular(vale.id).pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.onBuscar(); });
      }
    });
  }
}
