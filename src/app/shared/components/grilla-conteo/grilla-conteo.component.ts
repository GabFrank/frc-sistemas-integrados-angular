import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Moneda } from '../../../modules/financiero/moneda/moneda.model';
import { MonedaBillete } from '../../../modules/financiero/moneda/moneda-billetes/moneda-billetes.model';
import { MonedaBilletesService } from '../../../modules/financiero/moneda/moneda-billetes/moneda-billetes.service';

/** Una denominación con la cantidad contada. El subtotal alimenta el total, no se muestra. */
export interface FilaConteo {
  valor: number;
  cantidad: number;
  subtotal: number;
}

/**
 * Denominaciones por columna. Fijo, para que la altura no dependa de la moneda: si sobran,
 * se abre otra columna en vez de crecer hacia abajo y empujar el resumen fuera de vista.
 */
const FILAS_POR_COLUMNA = 10;

/**
 * Grilla de denominaciones para contar efectivo de una moneda.
 *
 * Solo cuenta y emite el total: no guarda, no postea y no sabe contra qué se compara. Eso lo
 * decide quien la usa — el arqueo de una caja compara contra el saldo del sistema y postea un
 * AJUSTE; la verificación de un retiro compara contra lo declarado por el PDV y acredita.
 *
 * Se extrajo de conteo-caja-dialog justamente porque ese diálogo mezclaba las dos cosas: la
 * grilla servía para los dos casos, pero su botón de confirmar estaba atado a una sola de las
 * dos operaciones.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-grilla-conteo',
  templateUrl: './grilla-conteo.component.html',
  styleUrls: ['./grilla-conteo.component.scss'],
})
export class GrillaConteoComponent implements OnChanges {

  @Input() moneda: Moneda;
  /** Cantidades iniciales por valor de billete. Sirve para reabrir un conteo a medio hacer. */
  @Input() cantidades: { [valor: string]: number } = {};

  @Output() totalChange = new EventEmitter<number>();
  /** Emite las cantidades por valor, para que el padre las persista si le sirve. */
  @Output() cantidadesChange = new EventEmitter<{ [valor: string]: number }>();

  filas: FilaConteo[] = [];
  columnas: FilaConteo[][] = [];
  total = 0;
  cargando = false;
  /** digitsInfo del pipe number según los decimales de la moneda. */
  formato = '1.0-2';

  constructor(private monedaBilletesService: MonedaBilletesService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['moneda'] && this.moneda?.id) {
      const m = this.moneda;
      const dec = m?.decimales != null
        ? m.decimales
        : ((m?.denominacion || '').toUpperCase().includes('GUARAN') ? 0 : 2);
      this.formato = `1.0-${dec}`;
      this.cargar();
    }
  }

  private cargar() {
    this.cargando = true;
    this.monedaBilletesService.onGetByMonedaId(this.moneda.id)
      .pipe(untilDestroyed(this))
      .subscribe((res: MonedaBillete[]) => {
        this.cargando = false;
        const activos = (res || []).filter(b => b?.activo !== false && b?.valor != null);
        // Mayor a menor: es el orden en que se cuenta plata en la mano.
        activos.sort((a, b) => b.valor - a.valor);
        this.filas = activos.map(b => {
          const cantidad = this.cantidades?.[String(b.valor)] || 0;
          return { valor: b.valor, cantidad, subtotal: cantidad * b.valor };
        });
        this.repartirEnColumnas();
        this.recalcular(false);
      });
  }

  private repartirEnColumnas() {
    this.columnas = [];
    for (let i = 0; i < this.filas.length; i += FILAS_POR_COLUMNA) {
      this.columnas.push(this.filas.slice(i, i + FILAS_POR_COLUMNA));
    }
  }

  onCantidadChange(fila: FilaConteo, valor: any) {
    const n = Number(valor);
    fila.cantidad = isNaN(n) || n < 0 ? 0 : Math.floor(n);
    fila.subtotal = fila.cantidad * fila.valor;
    this.recalcular(true);
  }

  private recalcular(emitirCantidades: boolean) {
    this.total = this.filas.reduce((acc, f) => acc + f.subtotal, 0);
    this.totalChange.emit(this.total);
    if (emitirCantidades) {
      const cantidades: { [valor: string]: number } = {};
      this.filas.forEach(f => { if (f.cantidad) cantidades[String(f.valor)] = f.cantidad; });
      this.cantidadesChange.emit(cantidades);
    }
  }

  /** Pone todo en cero. Lo llama el padre desde su propio botón. */
  limpiar() {
    this.filas.forEach(f => { f.cantidad = 0; f.subtotal = 0; });
    this.recalcular(true);
  }
}
