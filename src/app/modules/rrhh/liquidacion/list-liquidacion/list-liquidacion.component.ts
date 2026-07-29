import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PageInfo } from '../../../../app.component';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LiquidacionSueldo } from '../liquidacion.model';
import { LiquidacionService } from '../liquidacion.service';
import { GenerarLiquidacionDialogComponent } from '../generar-liquidacion-dialog/generar-liquidacion-dialog.component';
import { LiquidacionDetalleDialogComponent } from '../liquidacion-detalle-dialog/liquidacion-detalle-dialog.component';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabData, TabService } from '../../../../layouts/tab/tab.service';
import { ReporteService } from '../../../reportes/reporte.service';
import { ReportesComponent } from '../../../reportes/reportes/reportes.component';
import { ImpresionService } from '../../../../shared/components/imprimir/impresion.service';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-liquidacion',
  templateUrl: './list-liquidacion.component.html',
  styleUrls: ['./list-liquidacion.component.scss']
})
export class ListLiquidacionComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['periodo', 'funcionario', 'totalHaberes', 'totalDescuentos', 'totalNeto', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<LiquidacionSueldo>([]);

  funcionarioControl = new FormControl(null);
  periodoControl = new FormControl(null);
  estadoControl = new FormControl(null);

  estadoOpciones = ['BORRADOR', 'APROBADA', 'PAGADA', 'ANULADA'];

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<LiquidacionSueldo>;

  constructor(
    private liquidacionService: LiquidacionService,
    public mainService: MainService,
    private dialog: MatDialog,
    private tabService: TabService,
    private reporteService: ReporteService,
    private notificacion: NotificacionSnackbarService,
    private impresionService: ImpresionService
  ) { }

  ngOnInit(): void {
    this.periodoControl.setValue(this.periodoActual());
    this.onFiltrar();
  }

  private periodoActual(): string {
    const hoy = new Date();
    return hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2);
  }

  onFiltrar() {
    this.liquidacionService.onGetPage(
      this.pageIndex,
      this.pageSize,
      this.funcionarioControl.value,
      this.periodoControl.value,
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
    this.periodoControl.setValue(this.periodoActual());
    this.estadoControl.setValue(null);
    this.pageIndex = 0;
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  onGenerar() {
    this.dialog.open(GenerarLiquidacionDialogComponent, {
      data: { periodo: this.periodoControl.value },
      width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onDetalle(liq: LiquidacionSueldo) {
    // En tab (no dialogo) para poder comparar varias liquidaciones abiertas a la vez.
    this.tabService.addTab(new Tab(
      LiquidacionDetalleDialogComponent,
      'Liquidación ' + liq.id,
      new TabData(liq.id),
      ListLiquidacionComponent
    ));
  }

  onVerRecibo(liq: LiquidacionSueldo) {
    this.impresionService.imprimir(
      'Recibo ' + liq.periodo + ' - ' + (liq.funcionario?.persona?.nombre || liq.id),
      (anchoMm, escpos) => this.liquidacionService.onImprimirRecibo(liq.id, anchoMm, escpos));
  }
}
