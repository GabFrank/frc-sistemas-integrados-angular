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
import { Penalizacion } from '../penalizacion.model';
import { PenalizacionService } from '../penalizacion.service';
import { EditPenalizacionDialogComponent } from '../edit-penalizacion-dialog/edit-penalizacion-dialog.component';

interface FuncionarioOpcion {
  id: number;
  label: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-penalizacion',
  templateUrl: './list-penalizacion.component.html',
  styleUrls: ['./list-penalizacion.component.scss']
})
export class ListPenalizacionComponent implements OnInit {

  displayedColumns = ['fecha', 'tipo', 'descripcion', 'monto', 'auto', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Penalizacion>([]);

  funcionarioControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);
  fechaGenerarControl = new FormControl(null);

  funcionarioOpciones: FuncionarioOpcion[] = [];

  constructor(
    private penalizacionService: PenalizacionService,
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
    this.fechaGenerarControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1));
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
    this.penalizacionService.onGetPorFuncionarioYRango(
      this.funcionarioControl.value,
      dateToString(this.desdeControl.value),
      dateToString(this.hastaControl.value)
    ).pipe(untilDestroyed(this)).subscribe(res => {
      this.dataSource.data = res || [];
    });
  }

  onNueva() {
    this.dialog.open(EditPenalizacionDialogComponent, {
      data: { funcionarioOpciones: this.funcionarioOpciones, funcionarioId: this.funcionarioControl.value },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onBuscar();
    });
  }

  onAnular(p: Penalizacion) {
    this.dialogosService.confirm(
      'Anular penalización',
      '¿Desea anular esta penalización?',
      null, null, true, 'Sí', null, 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.penalizacionService.onAnular(p.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.onBuscar(); });
      }
    });
  }

  onGenerarAuto() {
    this.penalizacionService.onGenerarAuto(dateToString(this.fechaGenerarControl.value))
      .pipe(untilDestroyed(this))
      .subscribe((cant: number) => {
        this.notificacion.notification$.next({
          texto: 'Penalizaciones automáticas generadas: ' + (cant ?? 0),
          color: NotificacionColor.success,
          duracion: 3
        });
        this.onBuscar();
      });
  }
}
