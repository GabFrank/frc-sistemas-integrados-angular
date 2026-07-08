import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { Bono } from '../bono.model';
import { BonoService } from '../bono.service';
import { EditBonoDialogComponent } from '../edit-bono-dialog/edit-bono-dialog.component';

interface FuncionarioOpcion { id: number; label: string; }

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-bono',
  templateUrl: './list-bono.component.html',
  styleUrls: ['./list-bono.component.scss']
})
export class ListBonoComponent implements OnInit {

  displayedColumns = ['fecha', 'tipo', 'monto', 'motivo', 'recurrente', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Bono>([]);

  funcionarioControl = new FormControl(null);
  funcionarioOpciones: FuncionarioOpcion[] = [];

  constructor(
    private bonoService: BonoService,
    private funcionarioService: FuncionarioService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.cargarFuncionarios();
  }

  cargarFuncionarios() {
    this.funcionarioService.onGetAllFuncionarios(0, 500)
      .pipe(untilDestroyed(this))
      .subscribe((res: Funcionario[]) => {
        this.funcionarioOpciones = (res || []).map(f => ({
          id: f.id,
          label: f.persona?.nombre ? f.persona.nombre : (f.nickname ? f.nickname : '#' + f.id)
        }));
      });
  }

  onBuscar() {
    if (this.funcionarioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.bonoService.onGetPorFuncionario(this.funcionarioControl.value)
      .pipe(untilDestroyed(this)).subscribe(res => { this.dataSource.data = res || []; });
  }

  onNuevo() {
    this.dialog.open(EditBonoDialogComponent, {
      data: { funcionarioOpciones: this.funcionarioOpciones, funcionarioId: this.funcionarioControl.value },
      width: '520px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscar(); });
  }

  onAnular(bono: Bono) {
    this.dialogosService.confirm(
      'Anular bono', '¿Desea anular este bono?',
      null, null, true, 'Sí', null, 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.bonoService.onAnular(bono.id).pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.onBuscar(); });
      }
    });
  }
}
