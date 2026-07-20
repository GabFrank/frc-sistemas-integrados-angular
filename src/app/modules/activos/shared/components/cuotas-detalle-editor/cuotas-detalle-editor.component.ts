import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { CuotaDetalle, CuotasDetalleCalculado } from '../../models/cuota-detalle.model';
import { CuotasDetalleService } from '../../services/cuotas-detalle.service';

@UntilDestroy()
@Component({
  selector: 'app-cuotas-detalle-editor',
  templateUrl: './cuotas-detalle-editor.component.html',
  styleUrls: ['./cuotas-detalle-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class CuotasDetalleEditorComponent implements OnInit, OnChanges {
  private cuotasService = inject(CuotasDetalleService);
  private cdr = inject(ChangeDetectorRef);
  private recalcular$ = new Subject<{ preservarAjustes: boolean; version: number }>();
  private recalcVersion = 0;
  private emisionInterna = false;
  private omitirRecalculoMontoTotal = false;

  @Input() cantidadCuotas = 1;
  @Input() cantidadCuotasPagadas = 0;
  @Input() montoTotal = 0;
  @Input() montoYaPagado = 0;
  @Input() cuotas: CuotaDetalle[] = [];
  @Output() cuotasChange = new EventEmitter<CuotaDetalle[]>();
  @Output() montoTotalChange = new EventEmitter<number>();

  currencyMask = new CurrencyMask();
  cuotaEnEdicion: CuotaDetalle | null = null;
  indiceEdicion = -1;
  totalCuotasMonto = 0;
  displayedColumns = ['numero', 'monto', 'estado', 'accion'];

  ngOnInit(): void {
    this.recalcular$.pipe(
      debounceTime(300),
      switchMap(({ preservarAjustes, version }) =>
        this.cuotasService.calcularCuotas({
          cantidadCuotas: this.cantidadCuotas,
          cantidadCuotasPagadas: this.cantidadCuotasPagadas,
          montoTotal: this.montoTotal,
          montoYaPagado: this.montoYaPagado,
          cuotasDetalle: preservarAjustes ? this.cuotas : undefined,
        }).pipe(
          map(resultado => ({ resultado, version }))
        )
      ),
      untilDestroyed(this),
    ).subscribe(({ resultado, version }) => {
      if (version !== this.recalcVersion) {
        return;
      }
      this.emitir(resultado);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cuotas']) {
      const prev = changes['cuotas'].previousValue as CuotaDetalle[] | undefined;
      const curr = changes['cuotas'].currentValue as CuotaDetalle[] | undefined;
      if (this.emisionInterna) {
        this.emisionInterna = false;
      } else if (curr?.length && curr !== prev) {
        this.recalcVersion++;
        this.actualizarTotalCuotas();
        this.cdr.markForCheck();
        return;
      }
    }

    if (changes['montoTotal'] && this.omitirRecalculoMontoTotal) {
      this.omitirRecalculoMontoTotal = false;
      return;
    }

    if (
      changes['cantidadCuotas'] ||
      changes['cantidadCuotasPagadas'] ||
      changes['montoTotal'] ||
      changes['montoYaPagado']
    ) {
      this.solicitarRecalculo(false);
    }
  }

  private solicitarRecalculo(preservarAjustes: boolean): void {
    const version = ++this.recalcVersion;
    this.recalcular$.next({ preservarAjustes, version });
  }

  editarCuota(index: number): void {
    this.indiceEdicion = index;
    this.cuotaEnEdicion = { ...this.cuotas[index] };
    this.cdr.markForCheck();
  }

  guardarEdicionCuota(): void {
    if (this.indiceEdicion < 0 || !this.cuotaEnEdicion) {
      return;
    }
    this.cuotas = this.cuotas.map((c, i) =>
      i === this.indiceEdicion ? { ...this.cuotaEnEdicion! } : c
    );
    this.cancelarEdicionCuota();
    this.solicitarRecalculo(true);
  }

  cancelarEdicionCuota(): void {
    this.indiceEdicion = -1;
    this.cuotaEnEdicion = null;
    this.cdr.markForCheck();
  }

  agregarCuotaExtra(): void {
    const siguiente = (this.cuotas[this.cuotas.length - 1]?.numeroCuota || 0) + 1;
    this.cuotas = [
      ...this.cuotas,
      { numeroCuota: siguiente, monto: 0, pagado: false },
    ];
    this.cantidadCuotas = this.cuotas.length;
    this.solicitarRecalculo(true);
  }

  private actualizarTotalCuotas(): void {
    this.totalCuotasMonto = this.cuotasService.totalCuotas(this.cuotas);
  }

  private emitir(resultado: CuotasDetalleCalculado): void {
    this.cuotas = resultado.cuotas;
    this.actualizarTotalCuotas();
    this.emisionInterna = true;
    this.omitirRecalculoMontoTotal = true;
    this.cuotasChange.emit(this.cuotas);
    this.montoTotalChange.emit(resultado.montoTotal);
    this.cdr.markForCheck();
  }
}
