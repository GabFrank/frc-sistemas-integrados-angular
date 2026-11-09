import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual, MovimientoCajaVirtual, formatoDe, labelMovimiento } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { PageInfo } from '../../../../app.component';
import { FormControl, FormGroup } from '@angular/forms';

/** Card de saldo por moneda, ya formateada (no se calcula en el template). */
interface SaldoCard {
  denominacion: string;
  simbolo: string;
  saldo: number;
  formato: string;
  clase: string;
}

/** Fila con el concepto ya resuelto (no se calcula en el template). */
interface MovimientoRow extends MovimientoCajaVirtual {
  _label?: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-historial-movimientos-caja-virtual',
  templateUrl: './historial-movimientos-caja-virtual.component.html',
  styleUrls: ['./historial-movimientos-caja-virtual.component.scss']
})
export class HistorialMovimientosCajaVirtualComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;


  dataSource = new MatTableDataSource<MovimientoRow>([]);
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

  /** Saldos de `cajaVirtualSaldos`, los mismos de las cards del dashboard (#656). */
  saldoCards: SaldoCard[] = [];
  saldosCargados = false;
  saldosNoDisponibles = false;

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public cajaVirtual: CajaVirtual,
    private cajaVirtualService: CajaVirtualService,
    private notificacion: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      inicioControl: this.inicioControl,
      finControl: this.finControl,
    });
    this.cargarSaldos();
    this.buscar();
  }

  private cargarSaldos() {
    const clases = ['gs', 'rs', 'ds'];
    const noDisponibles = () => { this.saldosNoDisponibles = true; this.saldosCargados = true; };
    this.cajaVirtualService.onGetSaldos(this.cajaVirtual.id, true).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        if (res == null) { noDisponibles(); return; }
        this.saldoCards = res.map((s, i) => ({
          denominacion: s.moneda?.denominacion,
          simbolo: s.moneda?.simbolo,
          saldo: s.saldo,
          formato: formatoDe(s.moneda),
          clase: clases[i % clases.length],
        }));
        this.saldosCargados = true;
      },
      error: noDisponibles,
    });
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
    this.isSearching = true;
    if (this.inicioControl.value && this.finControl.value) {
      this.cajaVirtualService.onGetMovimientosPorFecha(
        this.cajaVirtual.id,
        this.inicioControl.value.toISOString(),
        this.finControl.value.toISOString(),
        this.pageIndex,
        this.pageSize
      ).pipe(untilDestroyed(this)).subscribe({ next: r => this.handleResponse(r), error: () => this.noCargo() });
    } else {
      this.cajaVirtualService.onGetMovimientos(this.cajaVirtual.id, this.pageIndex, this.pageSize)
        .pipe(untilDestroyed(this)).subscribe({ next: r => this.handleResponse(r), error: () => this.noCargo() });
    }
  }

  private noCargo() {
    this.isSearching = false;
    this.notificacion.openWarn('No se pudieron cargar los movimientos de la caja.', 5);
  }

  private handleResponse(res: PageInfo<MovimientoCajaVirtual>) {
    this.isSearching = false;
    if (res == null) { this.noCargo(); return; }
    this.selectedPageInfo = res;
    // Concepto real del movimiento, precomputado: sale del origen y no del tipo grueso
    // (ver caja-virtual.model). Se resuelve acá y no en el template para no recalcularlo
    // en cada ciclo de change detection.
    // Clonar antes de agregar props de display: Apollo congela los resultados y en dev
    // asignar sobre el objeto devuelto tira TypeError.
    this.dataSource.data = (res.getContent || []).map(m => ({
      ...m,
      _label: labelMovimiento(m.origenTipo, m.tipoMovimiento, this.tipoMovimientoLabels),
    } as MovimientoRow));
  }

  onResetFiltro() {
    this.inicioControl.setValue(null);
    this.finControl.setValue(null);
    this.onFiltrar();
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.buscar();
  }
  
}
