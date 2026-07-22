import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { HoraExtra, HoraExtraTipo } from '../hora-extra.model';
import { HoraExtraService } from '../hora-extra.service';
import { EditHoraExtraDialogComponent } from '../edit-hora-extra-dialog/edit-hora-extra-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-hora-extra',
  templateUrl: './list-hora-extra.component.html',
  styleUrls: ['./list-hora-extra.component.scss']
})
export class ListHoraExtraComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['fecha', 'funcionario', 'tipo', 'minutos', 'recargoPorcentaje', 'montoCalculado', 'origen', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<HoraExtra>([]);

  funcionarioControl = new FormControl(null);
  tipoControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  tipoOpciones: HoraExtraTipo[] = ['DIURNA', 'NOCTURNA', 'FERIADO'];

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<HoraExtra>;

  constructor(
    private horaExtraService: HoraExtraService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(hoy);
    this.onFiltrar();
  }

  onFiltrar() {
    this.horaExtraService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.funcionarioControl.value,
      dateToString(this.desdeControl.value, 'yyyy-MM-dd'),
      dateToString(this.hastaControl.value, 'yyyy-MM-dd'),
      this.tipoControl.value
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent || [];
      }
    });
  }

  onResetFiltro() {
    this.funcionarioControl.setValue(null);
    this.tipoControl.setValue(null);
    this.desdeControl.setValue(null);
    this.hastaControl.setValue(null);
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onNueva() {
    this.dialog.open(EditHoraExtraDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '560px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onAnular(he: HoraExtra) {
    this.dialogosService.confirm(
      'Anular hora extra',
      '¿Desea anular esta hora extra?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.horaExtraService.onAnular(he.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }
}
