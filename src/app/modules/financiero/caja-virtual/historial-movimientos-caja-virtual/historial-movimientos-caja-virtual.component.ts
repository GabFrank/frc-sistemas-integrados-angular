import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual, MovimientoCajaVirtual, labelMovimiento } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { PageInfo } from '../../../../app.component';
import { FormControl, FormGroup } from '@angular/forms';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-historial-movimientos-caja-virtual',
  templateUrl: './historial-movimientos-caja-virtual.component.html',
  styleUrls: ['./historial-movimientos-caja-virtual.component.scss']
})
export class HistorialMovimientosCajaVirtualComponent implements OnInit {

  dataSource = new MatTableDataSource<MovimientoCajaVirtual>([]);
  isSearching = false;
  pageIndex = 0;
  pageSize = 20;
  selectedPageInfo: PageInfo<MovimientoCajaVirtual>;

  displayedColumns = [
    'id',
    'creadoEn',
    'tipoMovimiento',
    'moneda',
    'cantidad',
    'cajaOrigen',
    'cajaDestino',
    'descripcion',
    'usuario',
  ];

  formGroup: FormGroup;
  inicioControl = new FormControl();
  finControl = new FormControl();

  tipoMovimientoLabels: Record<string, string> = {
    INGRESO: 'Ingreso',
    EGRESO: 'Egreso',
    TRANSFERENCIA_ENTRADA: 'Transf. Entrada',
    TRANSFERENCIA_SALIDA: 'Transf. Salida',
    PAGO_PROVEEDOR: 'Pago Proveedor',
    AJUSTE: 'Ajuste',
  };

  tipoColores: Record<string, string> = {
    INGRESO: '#4caf50',
    EGRESO: '#f44336',
    TRANSFERENCIA_ENTRADA: '#2196f3',
    TRANSFERENCIA_SALIDA: '#ff9800',
    PAGO_PROVEEDOR: '#9c27b0',
    AJUSTE: '#607d8b',
  };

  /** Concepto real del movimiento: sale del origen, no del tipo grueso (ver caja-virtual.model). */
  label(row: MovimientoCajaVirtual): string {
    return labelMovimiento(row?.origenTipo, row?.tipoMovimiento, this.tipoMovimientoLabels);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public cajaVirtual: CajaVirtual,
    private cajaVirtualService: CajaVirtualService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      inicioControl: this.inicioControl,
      finControl: this.finControl,
    });
    this.onFiltrar();
  }

  onFiltrar() {
    this.isSearching = true;
    if (this.inicioControl.value && this.finControl.value) {
      this.cajaVirtualService.onGetMovimientosPorFecha(
        this.cajaVirtual.id,
        this.inicioControl.value.toISOString(),
        this.finControl.value.toISOString(),
        this.pageIndex,
        this.pageSize
      ).pipe(untilDestroyed(this)).subscribe(this.handleResponse.bind(this));
    } else {
      this.cajaVirtualService.onGetMovimientos(this.cajaVirtual.id, this.pageIndex, this.pageSize)
        .pipe(untilDestroyed(this)).subscribe(this.handleResponse.bind(this));
    }
  }

  private handleResponse(res: PageInfo<MovimientoCajaVirtual>) {
    this.isSearching = false;
    if (res != null) {
      this.selectedPageInfo = res;
      this.dataSource.data = res.getContent;
    }
  }

  onResetFiltro() {
    this.inicioControl.setValue(null);
    this.finControl.setValue(null);
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFiltrar();
  }
  
}
