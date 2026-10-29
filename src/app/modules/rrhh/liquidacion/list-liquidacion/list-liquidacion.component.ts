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
import { formatearPeriodo } from '../../../../commons/core/utils/dateUtils';
import { liquidaAcotadoRrhh } from '../../rol-rrhh-sucursal';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { FuncionariosACargoGQL } from '../../../personas/funcionarios/graphql/funcionariosACargo';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../../shared/components/search-list-dialog/search-list-dialog.component';
import { LiquidacionFinalService } from '../../liquidacion-final/liquidacion-final.service';
import { LiquidacionFinalDialogComponent } from '../../liquidacion-final/liquidacion-final-dialog/liquidacion-final-dialog.component';
import { LiquidacionFinalGenerarDialogComponent } from '../../liquidacion-final/liquidacion-final-generar-dialog/liquidacion-final-generar-dialog.component';


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

  funcionarioNombreControl = new FormControl(null);
  periodoControl = new FormControl(null);
  estadoControl = new FormControl(null);

  estadoOpciones = ['BORRADOR', 'APROBADA', 'PAGADA', 'ANULADA'];

  pageIndex = 0;
  pageSize = 25;
  selectedPageInfo: PageInfo<LiquidacionSueldo>;

  /** Rol RRHH SUCURSAL: ve y liquida solo a los funcionarios de sus sucursales. */
  acotado = false;

  constructor(
    private liquidacionService: LiquidacionService,
    public mainService: MainService,
    private dialog: MatDialog,
    private tabService: TabService,
    private reporteService: ReporteService,
    private notificacion: NotificacionSnackbarService,
    private impresionService: ImpresionService,
    private liquidacionFinalService: LiquidacionFinalService,
    private funcionariosACargoGQL: FuncionariosACargoGQL
  ) { }

  ngOnInit(): void {
    this.acotado = liquidaAcotadoRrhh(this.mainService);
    this.periodoControl.setValue(this.periodoActual());
    this.buscar();

    this.periodoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(valor => {
      const formateado = formatearPeriodo(valor);
      if (formateado !== valor) {
        this.periodoControl.setValue(formateado, { emitEvent: false });
      }
    });
  }

  private periodoActual(): string {
    const hoy = new Date();
    return hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2);
  }

  // Un filtro nuevo arranca en la página 1: la página actual puede no existir en el resultado filtrado.
  onFiltrar() {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.buscar();
  }

  buscar() {
    this.liquidacionService.onGetPage(
      this.pageIndex,
      this.pageSize,
      null,
      this.funcionarioNombreControl.value,
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
    this.funcionarioNombreControl.setValue(null);
    this.periodoControl.setValue(this.periodoActual());
    this.estadoControl.setValue(null);
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.buscar();
  }

  onGenerar() {
    this.dialog.open(GenerarLiquidacionDialogComponent, {
      data: { periodo: this.periodoControl.value },
      width: '560px', disableClose: true
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.buscar(); });
  }

  /**
   * Finiquito de un funcionario a cargo: se elige al funcionario y, igual que desde el legajo, se abre el
   * finiquito vigente o el diálogo para generarlo.
   */
  onFiniquito() {
    const data: SearchListtDialogData = {
      titulo: 'Finiquito: elegir funcionario',
      tableData: [
        { id: 'id', nombre: 'Id', width: '10%' },
        { id: 'nombre', nombre: 'Nombre', nested: true, nestedId: 'persona', nestedColumnId: 'personaNombre', width: '45%' },
        { id: 'nombre', nombre: 'Cargo', nested: true, nestedId: 'cargo', nestedColumnId: 'cargoNombre', width: '25%' },
        { id: 'nombre', nombre: 'Sucursal', nested: true, nestedId: 'sucursal', nestedColumnId: 'sucursalNombre', width: '20%' }
      ],
      query: this.funcionariosACargoGQL,
      // También los ya egresados: su finiquito pagado se consulta desde acá.
      queryData: { soloActivos: false },
      fallbackToLocal: true
    };
    this.dialog.open(SearchListDialogComponent, {
      data, height: '80vh', width: '70vw', panelClass: 'search-dialog-dark'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((f: Funcionario) => {
      if (f != null) this.abrirFiniquito(f);
    });
  }

  private abrirFiniquito(f: Funcionario) {
    const nombre = f.persona?.nombre || ('#' + f.id);
    // Sin finiquito el backend responde una lista vacía, nunca null: null (error) o sin respuesta no se
    // toman como «no hay», porque se ofrecería generar otro encima del vigente (#390).
    this.liquidacionFinalService.onGetPorFuncionario(f.id).pipe(untilDestroyed(this)).subscribe({
      next: (res: any[]) => {
        if (res == null) { this.avisarFiniquitoNoConsultado(); return; }
        if (res.find(l => l.estado !== 'ANULADA')) { this.abrirTabFiniquito(f.id, nombre); return; }
        this.dialog.open(LiquidacionFinalGenerarDialogComponent, {
          data: { funcionarioId: f.id, nombre, monedaId: null }, width: '640px', maxWidth: '95vw'
        }).afterClosed().pipe(untilDestroyed(this)).subscribe(generado => {
          if (generado != null) this.abrirTabFiniquito(f.id, nombre);
        });
      },
      error: () => this.avisarFiniquitoNoConsultado()
    });
  }

  private avisarFiniquitoNoConsultado() {
    this.notificacion.notification$.next({
      texto: 'No se pudo consultar el finiquito del funcionario. Volvé a intentar.',
      color: NotificacionColor.warn, duracion: 5
    });
  }

  private abrirTabFiniquito(funcionarioId: number, nombre: string) {
    this.tabService.addTab(new Tab(
      LiquidacionFinalDialogComponent,
      'Finiquito — ' + nombre,
      new TabData(funcionarioId, { funcionarioId, nombre, monedaId: null }),
      ListLiquidacionComponent
    ));
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
