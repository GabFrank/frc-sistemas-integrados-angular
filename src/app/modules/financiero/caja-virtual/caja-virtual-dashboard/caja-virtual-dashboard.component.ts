import { Component, Input, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Tab, } from '../../../../layouts/tab/tab.model';
import { TabService, TabData } from '../../../../layouts/tab/tab.service';
import { CajaVirtual, CajaVirtualTipoMovimiento, MovimientoCajaVirtual } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { PageInfo } from '../../../../app.component';
import { AddMovimientoCajaVirtualDialogComponent, MovimientoDialogData } from '../add-movimiento-caja-virtual-dialog/add-movimiento-caja-virtual-dialog.component';
import { TransferenciaCajaVirtualDialogComponent } from '../transferencia-caja-virtual-dialog/transferencia-caja-virtual-dialog.component';
import { ListCajaVirtualComponent } from '../list-caja-virtual/list-caja-virtual.component';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-caja-virtual-dashboard',
  templateUrl: './caja-virtual-dashboard.component.html',
  styleUrls: ['./caja-virtual-dashboard.component.scss']
})
export class CajaVirtualDashboardComponent implements OnInit {

  @Input() data: Tab;

  cajaVirtual: CajaVirtual;

  // Selector de moneda activa en el balance card
  monedaList: Moneda[] = [];
  monedaSeleccionada: Moneda;

  // Historial
  dataSource = new MatTableDataSource<MovimientoCajaVirtual>([]);
  isLoading = false;
  hideBalance = true;
  pageIndex = 0;
  pageSize = 10;
  selectedPageInfo: PageInfo<MovimientoCajaVirtual>;

  displayedColumns = ['creadoEn', 'tipoMovimiento', 'moneda', 'cantidad', 'descripcion'];

  tipoMovimientoLabels: Record<string, string> = {
    INGRESO: 'Ingreso',
    EGRESO: 'Egreso',
    TRANSFERENCIA_ENTRADA: 'Transf. Entrada',
    TRANSFERENCIA_SALIDA: 'Transf. Salida',
    PAGO_PROVEEDOR: 'Pago Proveedor',
    AJUSTE: 'Ajuste',
  };

  tipoIconos: Record<string, string> = {
    INGRESO: 'add_circle',
    EGRESO: 'remove_circle',
    TRANSFERENCIA_ENTRADA: 'call_received',
    TRANSFERENCIA_SALIDA: 'call_made',
    PAGO_PROVEEDOR: 'receipt',
    AJUSTE: 'tune',
  };

  tipoColores: Record<string, string> = {
    INGRESO: '#4caf50',
    EGRESO: '#f44336',
    TRANSFERENCIA_ENTRADA: '#2196f3',
    TRANSFERENCIA_SALIDA: '#ff9800',
    PAGO_PROVEEDOR: '#9c27b0',
    AJUSTE: '#607d8b',
  };

  constructor(
    private cajaVirtualService: CajaVirtualService,
    private monedaService: MonedaService,
    private dialog: MatDialog,
    private tabService: TabService
  ) {}

  ngOnInit(): void {
    this.cajaVirtual = this.data?.tabData?.data as CajaVirtual;
    this.cargarMonedas();
    this.cargarMovimientos();
  }

  cargarMonedas() {
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res) {
        this.monedaList = res;
        // Seleccionar Guaraní por defecto
        this.monedaSeleccionada = res.find(m => 
          m.denominacion?.toUpperCase().includes('GUARANI')) ?? res[0];
      }
    });
  }

  cargarMovimientos() {
    if (!this.cajaVirtual?.id) return;
    this.isLoading = true;
    this.cajaVirtualService.onGetMovimientos(this.cajaVirtual.id, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.isLoading = false;
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        }
      });
  }

  // Saldo según moneda seleccionada
  getSaldoActual(): number {
    if (!this.cajaVirtual || !this.monedaSeleccionada) return 0;
    const d = this.monedaSeleccionada.denominacion?.toUpperCase();
    if (d?.includes('GUARANI')) return this.cajaVirtual.saldoGs ?? 0;
    if (d?.includes('REAL')) return this.cajaVirtual.saldoRs ?? 0;
    if (d?.includes('DOLAR')) return this.cajaVirtual.saldoDs ?? 0;
    return 0;
  }

  getPrecision(): string {
    const d = this.monedaSeleccionada?.denominacion?.toUpperCase();
    return d?.includes('GUARANI') ? '1.0-0' : '1.2-2';
  }

  onIngreso() {
    const dialogData: MovimientoDialogData = { 
      cajaVirtual: this.cajaVirtual, 
      tipoMovimiento: CajaVirtualTipoMovimiento.INGRESO 
    };
    this.dialog.open(AddMovimientoCajaVirtualDialogComponent, { 
      width: '500px', 
      data: dialogData 
    }).afterClosed().subscribe(res => { 
      if (res) this.recargar(); 
    });
  }

  onEgreso() {
    const dialogData: MovimientoDialogData = { 
      cajaVirtual: this.cajaVirtual, 
      tipoMovimiento: CajaVirtualTipoMovimiento.EGRESO 
    };
    this.dialog.open(AddMovimientoCajaVirtualDialogComponent, { 
      width: '500px', 
      data: dialogData 
    }).afterClosed().subscribe(res => { 
      if (res) this.recargar(); 
    });
  }

  onTransferencia() {
    this.dialog.open(TransferenciaCajaVirtualDialogComponent, { 
      width: '500px', 
      data: this.cajaVirtual 
    }).afterClosed().subscribe(res => { 
      if (res) this.recargar(); 
    });
  }

  recargar() {
    // Recargar la caja actualizada
    this.cajaVirtualService.onGetAll(0, 1).pipe(untilDestroyed(this)).subscribe(); // para refresh
    this.cargarMovimientos();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarMovimientos();
  }
}
