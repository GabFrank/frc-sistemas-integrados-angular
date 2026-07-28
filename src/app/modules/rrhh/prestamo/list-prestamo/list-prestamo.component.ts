import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { ReportesRrhhService } from '../../reportes/reportes-rrhh.service';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';
import { Prestamo } from '../prestamo.model';
import { PrestamoService } from '../prestamo.service';
import { EditPrestamoDialogComponent } from '../edit-prestamo-dialog/edit-prestamo-dialog.component';
import { PrestamoCuotasDialogComponent } from '../prestamo-cuotas-dialog/prestamo-cuotas-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-prestamo',
  templateUrl: './list-prestamo.component.html',
  styleUrls: ['./list-prestamo.component.scss']
})
export class ListPrestamoComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['fechaInicio', 'funcionario', 'descripcion', 'montoTotal', 'montoPagado', 'cantidadCuotas', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Prestamo>([]);

  funcionarioControl = new FormControl(null);
  estadoControl = new FormControl(null);

  estadoOpciones = ['ACTIVO', 'PAGADO', 'CANCELADO'];

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Prestamo>;

  constructor(
    private prestamoService: PrestamoService,
    public mainService: MainService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private reportesRrhhService: ReportesRrhhService,
    private impresionService: ImpresionService
  ) { }

  onVerRecibo(row: Prestamo) {
    this.impresionService.imprimir('Recibo préstamo ' + row.id,
      (anchoMm) => this.reportesRrhhService.onReciboPrestamo(row.id, anchoMm));
  }

  ngOnInit(): void {
    this.onFiltrar();
  }

  onFiltrar() {
    this.prestamoService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.funcionarioControl.value,
      this.estadoControl.value
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
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onNuevo() {
    this.dialog.open(EditPrestamoDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onVerCuotas(prestamo: Prestamo) {
    this.dialog.open(PrestamoCuotasDialogComponent, { data: { prestamo }, width: '640px', disableClose: false })
      .afterClosed().pipe(untilDestroyed(this)).subscribe(() => { this.onFiltrar(); });
  }
}
