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
import { ReportesRrhhService } from '../../reportes/reportes-rrhh.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
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

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['fecha', 'funcionario', 'motivo', 'monto', 'moneda', 'esAdelanto', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Vale>([]);

  funcionarioControl = new FormControl(null);
  estadoControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  estadoOpciones = ['SOLICITADO', 'CONFIRMADO', 'ANULADO', 'DESCONTADO'];

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Vale>;

  constructor(
    private valeService: ValeService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private reportesRrhhService: ReportesRrhhService,
    private impresionService: ImpresionService
  ) { }

  onVerRecibo(row: Vale) {
    this.impresionService.imprimir('Recibo vale ' + row.id,
      (anchoMm, escpos) => this.reportesRrhhService.onReciboVale(row.id, anchoMm, escpos));
  }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.valeService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.funcionarioControl.value,
      this.estadoControl.value,
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
    this.estadoControl.setValue(null);
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
    this.dialog.open(EditValeDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onConfirmar(vale: Vale) {
    this.dialog.open(ConfirmarValeDialogComponent, { data: { vale }, width: '480px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onAnular(vale: Vale) {
    this.dialogosService.confirm(
      'Anular vale', '¿Desea anular este vale?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.valeService.onAnular(vale.id).pipe(untilDestroyed(this)).subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }
}
