import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PaginacionLista, PaginaCentral } from '../../../../shared/components/paginacion/paginacion-lista';
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


  dataSource = new MatTableDataSource<MovimientoRow>([]);
  /** Movimientos de la caja paginados en el central (#772), con el rango de fechas a la vista. */
  pag: PaginacionLista<MovimientoRow> = new PaginacionLista<MovimientoRow>({
    cargar: (page, size) => this.consultar(page, size),
    pageSize: 20,
    pageSizeOptions: [10, 20, 50],
    alCargar: (res) => this.dataSource.data = res.getContent ?? [],
    alFallar: (filtroNuevo) => {
      if (filtroNuevo) this.dataSource.data = [];
    },
  });

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
    this.pag.filtrar();
  }

  buscar() {
    this.pag.recargar();
  }

  private consultar(page: number, size: number): Observable<PaginaCentral<MovimientoRow> | null> {
    const consulta$ = this.inicioControl.value && this.finControl.value
      ? this.cajaVirtualService.onGetMovimientosPorFecha(
        this.cajaVirtual.id,
        this.inicioControl.value.toISOString(),
        this.finControl.value.toISOString(),
        page,
        size
      )
      : this.cajaVirtualService.onGetMovimientos(this.cajaVirtual.id, page, size);
    return consulta$.pipe(
      map((res: PageInfo<MovimientoCajaVirtual>) => {
        if (res == null) {
          this.noCargo();
          return null;
        }
        // Concepto real del movimiento, precomputado: sale del origen y no del tipo grueso
        // (ver caja-virtual.model). Se resuelve acá y no en el template para no recalcularlo
        // en cada ciclo de change detection.
        // Clonar antes de agregar props de display: Apollo congela los resultados y en dev
        // asignar sobre el objeto devuelto tira TypeError.
        return {
          getTotalElements: res.getTotalElements,
          getContent: (res.getContent || []).map(m => ({
            ...m,
            _label: labelMovimiento(m.origenTipo, m.tipoMovimiento, this.tipoMovimientoLabels),
          } as MovimientoRow)),
        };
      }),
      catchError(() => {
        this.noCargo();
        return of(null);
      })
    );
  }

  private noCargo() {
    this.notificacion.openWarn('No se pudieron cargar los movimientos de la caja.', 5);
  }

  onResetFiltro() {
    this.inicioControl.setValue(null);
    this.finControl.setValue(null);
    this.onFiltrar();
  }
  
}
