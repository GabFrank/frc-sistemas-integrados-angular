import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Aguinaldo } from '../aguinaldo.model';
import { AguinaldoService } from '../aguinaldo.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-aguinaldo',
  templateUrl: './list-aguinaldo.component.html',
  styleUrls: ['./list-aguinaldo.component.scss']
})
export class ListAguinaldoComponent implements OnInit {

  displayedColumns = ['funcionario', 'mesesTrabajados', 'montoCalculado', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Aguinaldo>([]);

  anioControl = new FormControl(null);

  constructor(
    private aguinaldoService: AguinaldoService,
    public mainService: MainService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.anioControl.setValue(new Date().getFullYear());
  }

  onBuscar() {
    if (this.anioControl.value == null) { return; }
    this.aguinaldoService.onGetPorAnio(this.anioControl.value)
      .pipe(untilDestroyed(this)).subscribe(res => { this.dataSource.data = res || []; });
  }

  onCalcular() {
    if (this.anioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Ingrese el año', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.dialogosService.confirm(
      'Calcular aguinaldos',
      '¿Calcular los aguinaldos del año ' + this.anioControl.value + ' para todos los funcionarios activos?',
      null, null, true, 'Sí', null, 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.aguinaldoService.onCalcular(this.anioControl.value)
          .pipe(untilDestroyed(this)).subscribe((cant: number) => {
            this.notificacion.notification$.next({ texto: 'Aguinaldos calculados: ' + (cant ?? 0), color: NotificacionColor.success, duracion: 3 });
            this.onBuscar();
          });
      }
    });
  }

  onAprobar(a: Aguinaldo) {
    this.aguinaldoService.onAprobar(a.id)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onBuscar(); });
  }
}
