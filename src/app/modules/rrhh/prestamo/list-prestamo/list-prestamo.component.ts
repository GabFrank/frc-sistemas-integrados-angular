import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionarioService } from '../../../personas/funcionarios/funcionario.service';
import { Prestamo } from '../prestamo.model';
import { PrestamoService } from '../prestamo.service';
import { EditPrestamoDialogComponent } from '../edit-prestamo-dialog/edit-prestamo-dialog.component';
import { PrestamoCuotasDialogComponent } from '../prestamo-cuotas-dialog/prestamo-cuotas-dialog.component';

interface FuncionarioOpcion { id: number; label: string; }

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
  funcionarioOpciones: FuncionarioOpcion[] = [];

  constructor(
    private prestamoService: PrestamoService,
    private funcionarioService: FuncionarioService,
    public mainService: MainService,
    private dialog: MatDialog,
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
    this.prestamoService.onGetPorFuncionario(this.funcionarioControl.value)
      .pipe(untilDestroyed(this)).subscribe(res => { this.dataSource.data = res || []; });
  }

  onNuevo() {
    this.dialog.open(EditPrestamoDialogComponent, {
      data: { funcionarioOpciones: this.funcionarioOpciones, funcionarioId: this.funcionarioControl.value },
      width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscar(); });
  }

  onVerCuotas(prestamo: Prestamo) {
    this.dialog.open(PrestamoCuotasDialogComponent, { data: { prestamo }, width: '640px', disableClose: false })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => { this.onBuscar(); });
  }
}
