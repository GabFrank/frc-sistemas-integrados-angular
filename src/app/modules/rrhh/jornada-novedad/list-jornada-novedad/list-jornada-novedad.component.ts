import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { JornadaNovedad } from '../jornada-novedad.model';
import { JornadaNovedadService } from '../jornada-novedad.service';
import { EditJornadaNovedadDialogComponent } from '../edit-jornada-novedad-dialog/edit-jornada-novedad-dialog.component';

interface FuncionarioOpcion {
  id: number;
  label: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-jornada-novedad',
  templateUrl: './list-jornada-novedad.component.html',
  styleUrls: ['./list-jornada-novedad.component.scss']
})
export class ListJornadaNovedadComponent implements OnInit {

  displayedColumns = ['fecha', 'tipo', 'observacion', 'registradoPor', 'acciones'];
  dataSource = new MatTableDataSource<JornadaNovedad>([]);

  funcionarioControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  funcionarioOpciones: FuncionarioOpcion[] = [];

  constructor(
    private novedadService: JornadaNovedadService,
    private funcionarioService: FuncionarioService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(hoy);
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
      this.notificacion.notification$.next({
        texto: 'Seleccione un funcionario', color: NotificacionColor.warn, duracion: 3
      });
      return;
    }
    this.novedadService.onGetPorFuncionarioYRango(
      this.funcionarioControl.value,
      dateToString(this.desdeControl.value),
      dateToString(this.hastaControl.value)
    ).pipe(untilDestroyed(this)).subscribe(res => {
      this.dataSource.data = res || [];
    });
  }

  onNueva() {
    this.dialog.open(EditJornadaNovedadDialogComponent, {
      data: { funcionarioOpciones: this.funcionarioOpciones, funcionarioId: this.funcionarioControl.value },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onBuscar();
    });
  }

  onEliminar(n: JornadaNovedad) {
    this.dialogosService.confirm(
      'Eliminar novedad',
      '¿Desea eliminar esta novedad?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.novedadService.onDelete(n.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.onBuscar(); });
      }
    });
  }
}
