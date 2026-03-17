import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { CajaVirtual, CajaVirtualTipo, CajaVirtualTipoMovimiento } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { PageInfo } from '../../../../app.component';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { AddCajaVirtualDialogComponent } from '../add-caja-virtual-dialog/add-caja-virtual-dialog.component';
import { AddMovimientoCajaVirtualDialogComponent, MovimientoDialogData } from '../add-movimiento-caja-virtual-dialog/add-movimiento-caja-virtual-dialog.component';
import { TransferenciaCajaVirtualDialogComponent } from '../transferencia-caja-virtual-dialog/transferencia-caja-virtual-dialog.component';
import { HistorialMovimientosCajaVirtualComponent } from '../historial-movimientos-caja-virtual/historial-movimientos-caja-virtual.component';
import { Tab } from '../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { CajaVirtualDashboardComponent } from '../caja-virtual-dashboard/caja-virtual-dashboard.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-caja-virtual',
  templateUrl: './list-caja-virtual.component.html',
  styleUrls: ['./list-caja-virtual.component.scss']
})
export class ListCajaVirtualComponent implements OnInit {

  @Input() data: Tab;

  dataSource = new MatTableDataSource<CajaVirtual>([]);
  selectedCajaVirtual: CajaVirtual;
  isSearching = false;
  pageIndex = 0;
  pageSize = 10;
  selectedPageInfo: PageInfo<CajaVirtual>;

  tipoList = [
    { label: 'Caja Mayor', value: CajaVirtualTipo.CAJA_MAYOR },
    { label: 'Caja Chica', value: CajaVirtualTipo.CAJA_CHICA }
  ];

  displayedColumns = [
    'id',
    'nombre',
    'tipo',
    'sucursal',
    'responsable',
    'saldoGs',
    'saldoRs',
    'saldoDs',
    'activo',
    'operaciones',
    'acciones'
  ];

  formGroup: FormGroup;
  nombreControl = new FormControl();
  tipoControl = new FormControl();

  constructor(
    private cajaVirtualService: CajaVirtualService,
    private dialog: MatDialog,
    private notificacion: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private tabService: TabService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombreControl: this.nombreControl,
      tipoControl: this.tipoControl,
    });
    this.onFiltrar();
  }

  onFiltrar() {
    this.isSearching = true;
    this.cajaVirtualService.onGetAll(this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<CajaVirtual>) => {
        this.isSearching = false;
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        }
      });
  }

  onAdd() {
    this.dialog.open(AddCajaVirtualDialogComponent, {
      width: '600px',
      data: null
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onEdit(item: CajaVirtual) {
    this.dialog.open(AddCajaVirtualDialogComponent, {
      width: '600px',
      data: item
    }).afterClosed().subscribe(res => {
      if (res != null) this.onFiltrar();
    });
  }

  onDelete(item: CajaVirtual) {
    this.dialogosService.confirm(
      'Eliminar Caja Virtual',
      `¿Está seguro que desea eliminar la caja "${item.nombre}"?`,
      null, null
    ).subscribe(confirmed => {
      if (confirmed) {
        this.cajaVirtualService.onDelete(item.id)
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res) {
              this.notificacion.openSucess('Caja virtual eliminada correctamente');
              this.onFiltrar();
            } else {
              this.notificacion.openAlgoSalioMal('No se pudo eliminar la caja virtual');
            }
          });
      }
    });
  }

  onIngreso(item: CajaVirtual) {
    const data: MovimientoDialogData = { cajaVirtual: item, tipoMovimiento: CajaVirtualTipoMovimiento.INGRESO };
    this.dialog.open(AddMovimientoCajaVirtualDialogComponent, { width: '500px', data })
      .afterClosed().subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onEgreso(item: CajaVirtual) {
    const data: MovimientoDialogData = { cajaVirtual: item, tipoMovimiento: CajaVirtualTipoMovimiento.EGRESO };
    this.dialog.open(AddMovimientoCajaVirtualDialogComponent, { width: '500px', data })
      .afterClosed().subscribe(res => { if (res != null) this.onFiltrar(); });
  }

  onTransferencia(item: CajaVirtual) {
    this.dialog.open(TransferenciaCajaVirtualDialogComponent, { width: '560px', data: item })
      .afterClosed().subscribe(res => { if (res) this.onFiltrar(); });
  }

  onVerDashboard(item: CajaVirtual) {
    this.tabService.addTab(
      new Tab(CajaVirtualDashboardComponent, `Caja: ${item.nombre}`, new TabData(item.id, item), ListCajaVirtualComponent)
    );
  }

  onHistorial(item: CajaVirtual) {
    this.dialog.open(HistorialMovimientosCajaVirtualComponent, {
      width: '95vw', maxWidth: '1200px', height: '85vh', data: item
    });
  }

  onResetFiltro() {
    this.nombreControl.setValue(null);
    this.tipoControl.setValue(null);
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }

  getTipoLabel(tipo: CajaVirtualTipo): string {
    return tipo === CajaVirtualTipo.CAJA_MAYOR ? 'Caja Mayor' : 'Caja Chica';
  }
}
