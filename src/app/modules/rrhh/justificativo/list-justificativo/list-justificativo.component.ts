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
import { Justificativo, TipoJustificativo } from '../justificativo.model';
import { JustificativoService } from '../justificativo.service';
import { EditJustificativoDialogComponent } from '../edit-justificativo-dialog/edit-justificativo-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-justificativo',
  templateUrl: './list-justificativo.component.html',
  styleUrls: ['./list-justificativo.component.scss']
})
export class ListJustificativoComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['fecha', 'funcionario', 'tipo', 'observacion', 'registradoPor', 'acciones'];
  dataSource = new MatTableDataSource<Justificativo>([]);

  tipoOptions: TipoJustificativo[] = [];

  funcionarioControl = new FormControl(null);
  tipoControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Justificativo>;

  constructor(
    private justificativoService: JustificativoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.inicializarFechasMesActual();
    this.justificativoService.onGetTiposActivos().pipe(untilDestroyed(this))
      .subscribe((res: TipoJustificativo[]) => { this.tipoOptions = res || []; });
    this.onFiltrar();
  }

  private inicializarFechasMesActual() {
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(hoy);
  }

  onFiltrar() {
    this.justificativoService.onGetPage(
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
    this.inicializarFechasMesActual();
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onNueva() {
    this.dialog.open(EditJustificativoDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onEditar(n: Justificativo) {
    this.dialog.open(EditJustificativoDialogComponent, {
      data: { funcionarioId: n.funcionario?.id, justificativo: n },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onFiltrar();
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
          .subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }
}
