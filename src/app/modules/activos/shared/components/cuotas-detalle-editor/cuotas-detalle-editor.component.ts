import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CuotaDetalle } from '../../models/cuota-detalle.model';
import { CuotasDetalleService } from '../../services/cuotas-detalle.service';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';

@Component({
  selector: 'app-cuotas-detalle-editor',
  templateUrl: './cuotas-detalle-editor.component.html',
  styleUrls: ['./cuotas-detalle-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuotasDetalleEditorComponent implements OnChanges {
  private cuotasService = inject(CuotasDetalleService);
  private cdr = inject(ChangeDetectorRef);

  @Input() cantidadCuotas = 1;
  @Input() cantidadCuotasPagadas = 0;
  @Input() montoTotal = 0;
  @Input() montoYaPagado = 0;
  @Input() cuotas: CuotaDetalle[] = [];
  @Output() cuotasChange = new EventEmitter<CuotaDetalle[]>();

  currencyMask = new CurrencyMask();
  cuotaEnEdicion: CuotaDetalle | null = null;
  indiceEdicion = -1;
  totalCuotasMonto = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['cantidadCuotas'] ||
      changes['cantidadCuotasPagadas'] ||
      changes['montoTotal'] ||
      changes['montoYaPagado']
    ) {
      this.regenerarCuotas();
    } else if (changes['cuotas']) {
      this.actualizarTotalCuotas();
    }
  }

  regenerarCuotas(): void {
    this.cuotas = this.cuotasService.generarCuotas(
      this.cantidadCuotas,
      this.cantidadCuotasPagadas,
      this.montoTotal,
      this.montoYaPagado,
      this.cuotas
    );
    this.emitir();
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
    this.emitir();
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
    this.emitir();
  }

  private actualizarTotalCuotas(): void {
    this.totalCuotasMonto = this.cuotasService.totalCuotas(this.cuotas);
  }

  private emitir(): void {
    this.actualizarTotalCuotas();
    this.cuotasChange.emit(this.cuotas);
    this.cdr.markForCheck();
  }
}
