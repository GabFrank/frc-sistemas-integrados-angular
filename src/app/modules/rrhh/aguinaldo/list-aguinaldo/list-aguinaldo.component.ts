import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
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

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['funcionario', 'anio', 'mesesTrabajados', 'montoCalculado', 'montoProyectado', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Aguinaldo>([]);

  funcionarioControl = new FormControl(null);
  anioControl = new FormControl(null);

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Aguinaldo>;

  constructor(
    private aguinaldoService: AguinaldoService,
    public mainService: MainService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.anioControl.setValue(new Date().getFullYear());
    this.onFiltrar();
  }

  onFiltrar() {
    this.aguinaldoService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.anioControl.value,
      this.funcionarioControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent || [];
      }
    });
  }

  onResetFiltro() {
    this.funcionarioControl.setValue(null);
    this.anioControl.setValue(null);
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onCalcular() {
    if (this.anioControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Ingrese el año', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.dialogosService.confirm(
      'Calcular aguinaldos',
      '¿Calcular los aguinaldos del año ' + this.anioControl.value + ' para todos los funcionarios activos?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.aguinaldoService.onCalcular(this.anioControl.value)
          .pipe(untilDestroyed(this)).subscribe((cant: number) => {
            this.notificacion.notification$.next({ texto: 'Aguinaldos calculados: ' + (cant ?? 0), color: NotificacionColor.success, duracion: 3 });
            this.onFiltrar();
          });
      }
    });
  }

  onAprobar(a: Aguinaldo) {
    this.aguinaldoService.onAprobar(a.id)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }
}
