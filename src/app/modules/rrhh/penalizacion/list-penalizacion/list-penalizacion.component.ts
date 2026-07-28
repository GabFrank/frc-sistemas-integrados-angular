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
import { Penalizacion, PenalizacionTipo } from '../penalizacion.model';
import { PenalizacionService } from '../penalizacion.service';
import { EditPenalizacionDialogComponent } from '../edit-penalizacion-dialog/edit-penalizacion-dialog.component';
import { GenerarPenalizacionesDialogComponent } from '../generar-penalizaciones-dialog/generar-penalizaciones-dialog.component';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-penalizacion',
  templateUrl: './list-penalizacion.component.html',
  styleUrls: ['./list-penalizacion.component.scss']
})
export class ListPenalizacionComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['fecha', 'funcionario', 'tipo', 'descripcion', 'monto', 'auto', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Penalizacion>([]);

  funcionarioControl = new FormControl(null);
  tipoControl = new FormControl(null);
  desdeControl = new FormControl(null);
  hastaControl = new FormControl(null);

  tipoOpciones: PenalizacionTipo[] = [
    'TARDANZA', 'AUSENCIA', 'QUEJA_CLIENTE', 'AMBIENTE_LABORAL',
    'DANIO_MATERIAL', 'COMISION_DESCUENTO', 'OTRO'
  ];

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<Penalizacion>;

  constructor(
    private penalizacionService: PenalizacionService,
    public mainService: MainService,
    private dialog: MatDialog,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private reportesRrhhService: ReportesRrhhService,
    private impresionService: ImpresionService
  ) { }

  onVerRecibo(row: Penalizacion) {
    this.impresionService.imprimir('Recibo penalización ' + row.id,
      (anchoMm) => this.reportesRrhhService.onReciboPenalizacion(row.id, anchoMm));
  }

  ngOnInit(): void {
    const hoy = new Date();
    this.desdeControl.setValue(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hastaControl.setValue(hoy);
    this.onFiltrar();
  }

  onFiltrar() {
    this.penalizacionService.onGetPage(
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
    this.dialog.open(EditPenalizacionDialogComponent, {
      data: { funcionarioId: this.funcionarioControl.value },
      width: '520px',
      disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onAnular(p: Penalizacion) {
    this.dialogosService.confirm(
      'Anular penalización',
      '¿Desea anular esta penalización?',
      null, null, true, 'Sí', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res === true) {
        this.penalizacionService.onAnular(p.id)
          .pipe(untilDestroyed(this))
          .subscribe(ok => { if (ok) this.onFiltrar(); });
      }
    });
  }

  onGenerarAuto() {
    // La fecha es parametro de la accion, no un filtro: se pide en el dialogo.
    this.dialog.open(GenerarPenalizacionesDialogComponent, { width: '460px', disableClose: true })
      .afterClosed().pipe(untilDestroyed(this)).subscribe((fecha: Date) => {
        if (fecha == null) return;
        this.penalizacionService.onGenerarAuto(dateToString(fecha, 'yyyy-MM-dd'))
          .pipe(untilDestroyed(this))
          .subscribe((cant: number) => {
            const generadas = cant ?? 0;
            this.notificacion.notification$.next({
              texto: generadas > 0
                ? 'Penalizaciones automáticas generadas: ' + generadas
                : 'No se generó ninguna penalización para esa fecha',
              color: generadas > 0 ? NotificacionColor.success : NotificacionColor.warn,
              duracion: 4
            });
            this.onFiltrar();
          });
      });
  }
}
