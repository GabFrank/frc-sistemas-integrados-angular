import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { Bono, BonoTipo } from '../bono.model';
import { BonoService } from '../bono.service';
import { EditBonoDialogComponent } from '../edit-bono-dialog/edit-bono-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-bono',
  templateUrl: './list-bono.component.html',
  styleUrls: ['./list-bono.component.scss']
})
export class ListBonoComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['fecha', 'funcionario', 'tipo', 'monto', 'motivo', 'recurrente', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Bono>([]);

  funcionarioControl = new FormControl(null);
  tipoControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  tipoOpciones: BonoTipo[] = ['CUMPLEANIOS', 'NAVIDAD', 'DESEMPENIO', 'PRODUCTIVIDAD', 'OTRO'];

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Bono>;

  constructor(
    private bonoService: BonoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.bonoService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.funcionarioControl.value,
      this.tipoControl.value,
      dateToString(this.desdeControl.value, 'yyyy-MM-dd'),
      dateToString(this.hastaControl.value, 'yyyy-MM-dd')
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

  onNuevo() {
    this.dialog.open(EditBonoDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '520px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onAnular(bono: Bono) {
    this.dialogosService.confirm(
      'Anular bono', '¿Desea anular este bono?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.bonoService.onAnular(bono.id).pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }
}
