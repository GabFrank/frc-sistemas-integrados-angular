import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatDialog } from '@angular/material/dialog';
import { Producto } from '../../productos/producto/producto.model';
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData
} from '../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { GraficoService } from '../grafico.service';
import { dateToString } from '../../../commons/core/utils/dateUtils';
import { formatoMonedaPy } from '../../../shared/utils/grafico-echarts.theme';
import { ProductoCostoPorPeriodo } from './interfaces/producto-costo-periodo.model';
import { EvolucionCostoResponse } from './interfaces/evolucion-costo-response.model';
import { EvolucionCostoVista } from './interfaces/evolucion-costo-vista.model';

type VistaTemporal = 'dia' | 'mes';

interface RangoFechas {
  inicio: string;
  fin: string;
  inicioDate: Date;
  finDate: Date;
}

interface SerieCosto {
  etiquetas: string[];
  tooltips: string[];
  promedios: (number | null)[];
  minimos: (number | null)[];
  maximos: (number | null)[];
  cantidades: number[];
  comprasCount: number[];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'evolucion-costo',
  templateUrl: './evolucion-costo.component.html',
  styleUrls: ['./evolucion-costo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'evolucion-costo-host' }
})
export class EvolucionCostoComponent implements OnInit {

  private graficoService = inject(GraficoService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  private datosSubject = new BehaviorSubject<EvolucionCostoVista | null>(null);
  datos$: Observable<EvolucionCostoVista | null> = this.datosSubject.asObservable();

  cargando = false;
  productoSeleccionado: Producto | null = null;
  etiquetaProducto = 'Seleccione un producto';

  fechaRangoGroup = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null)
  });

  // El costo de compra se registra de forma global (no por sucursal) y la vista es siempre mensual.
  private readonly vista: VistaTemporal = 'mes';

  private meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  private colores = {
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    primary: '#689F38',
    accent: '#009688',
    warn: '#F44336'
  };

  ngOnInit(): void {
    this.inicializarRangoPorDefecto();
  }

  private inicializarRangoPorDefecto(): void {
    const hoy = new Date();
    // Últimos 12 meses por defecto: la tendencia de costo es más útil que un solo mes.
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
    this.fechaRangoGroup.setValue({ inicio, fin: hoy }, { emitEvent: false });
  }

  /** Aplica los filtros manualmente (botón Filtrar). */
  filtrar(): void {
    this.cargarDatos();
  }

  abrirBusquedaProducto(): void {
    const data: PdvSearchProductoData = {
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
      modoSeleccionMultiple: false,
      productosSeleccionados: this.productoSeleccionado ? [this.productoSeleccionado] : []
    };

    this.dialog.open(PdvSearchProductoDialogComponent, {
      data,
      width: '75%',
      height: '85%',
      maxWidth: '95vw'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: PdvSearchProductoResponseData) => {
      // El diálogo en modo simple devuelve `producto`; el array `productos` solo en modo múltiple.
      const producto = res?.productos?.length ? res.productos[0] : res?.producto;
      if (producto) {
        this.seleccionarProducto(producto);
      }
    });
  }

  private seleccionarProducto(producto: Producto): void {
    this.productoSeleccionado = producto;
    this.etiquetaProducto = producto.descripcion;
    this.cargarDatos();
  }

  limpiarProducto(): void {
    this.productoSeleccionado = null;
    this.etiquetaProducto = 'Seleccione un producto';
    this.datosSubject.next(null);
    this.cdr.markForCheck();
  }

  private obtenerRangoFechas(): RangoFechas | null {
    const inicio = this.fechaRangoGroup.value.inicio;
    const fin = this.fechaRangoGroup.value.fin;
    if (!inicio || !fin) return null;

    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);
    inicioDate.setHours(0, 0, 0, 0);
    finDate.setHours(0, 0, 0, 0);
    if (finDate < inicioDate) return null;

    const finExclusive = new Date(finDate);
    finExclusive.setDate(finExclusive.getDate() + 1);

    return {
      inicio: `${dateToString(inicioDate, 'yyyy-MM-dd')} 00:00:00`,
      fin: `${dateToString(finExclusive, 'yyyy-MM-dd')} 00:00:00`,
      inicioDate,
      finDate
    };
  }

  private cargarDatos(): void {
    if (!this.productoSeleccionado) return;
    const rango = this.obtenerRangoFechas();
    if (!rango) return;

    this.cargando = true;
    this.cdr.markForCheck();

    const productoId = Number(this.productoSeleccionado.id);
    const vista = this.vista;

    this.graficoService.obtenerEvolucionCostoProducto(rango.inicio, rango.fin, productoId, vista).pipe(
      catchError(() => of(null)),
      untilDestroyed(this)
    ).subscribe(respuesta => {
      this.cargando = false;
      this.datosSubject.next(this.construirVista(respuesta, vista, rango));
      this.cdr.markForCheck();
    });
  }

  /** Toma la serie + resumen (ya calculado en backend) y los prepara para presentación. */
  private construirVista(respuesta: EvolucionCostoResponse | null, vista: VistaTemporal, rango: RangoFechas): EvolucionCostoVista {
    const nombre = this.productoSeleccionado?.descripcion || 'Producto';
    const periodos = respuesta?.periodos || [];
    const resumen = respuesta?.resumen;
    const serie = vista === 'mes'
      ? this.prepararSerieMensual(periodos, rango)
      : this.prepararSerieDiaria(periodos, rango);

    const variacionPct = resumen?.variacionPorcentual ?? 0;
    const periodoPico = this.formatearPeriodo(resumen?.periodoConMayorCosto || '-', vista);

    return {
      chartOptions: this.construirChart(serie, nombre, vista),
      hayDatos: resumen?.hayDatos ?? false,
      productoNombre: nombre,
      costoInicial: formatoMonedaPy(Math.round(resumen?.costoInicial ?? 0)),
      costoFinal: formatoMonedaPy(Math.round(resumen?.costoFinal ?? 0)),
      variacion: `${variacionPct >= 0 ? '+' : ''}${variacionPct.toFixed(1)}%`,
      variacionPositiva: variacionPct > 0,
      costoPromedio: formatoMonedaPy(Math.round(resumen?.costoPromedioPonderado ?? 0)),
      periodoPico,
      totalCompras: resumen?.totalCompras ?? 0
    };
  }

  private construirChart(serie: SerieCosto, nombreProducto: string, vista: VistaTemporal): EChartsOption {
    const rotar = serie.etiquetas.length > 14;
    const titulo = vista === 'mes' ? 'Evolución mensual del costo' : 'Evolución diaria del costo';

    return {
      title: {
        text: `${titulo}: ${this.truncar(nombreProducto, 35)}`,
        subtext: 'Costo unitario de compra (ponderado por cantidad)',
        left: 'center',
        textStyle: { color: this.colores.text, fontSize: 14, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 11 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0;
          const prom = serie.promedios[idx];
          if (prom == null) {
            return `<strong>${serie.tooltips[idx]}</strong><br/>Sin compras`;
          }
          return `<strong>${serie.tooltips[idx]}</strong><br/>
            Costo promedio: ${formatoMonedaPy(Math.round(prom))}<br/>
            Costo mínimo: ${formatoMonedaPy(Math.round(serie.minimos[idx] || 0))}<br/>
            Costo máximo: ${formatoMonedaPy(Math.round(serie.maximos[idx] || 0))}<br/>
            Cantidad comprada: ${(serie.cantidades[idx] || 0).toLocaleString('es-PY')}<br/>
            Compras: ${serie.comprasCount[idx] || 0}`;
        }
      },
      legend: {
        data: ['Costo promedio', 'Costo mínimo', 'Costo máximo'],
        bottom: 0,
        textStyle: { color: this.colores.textSecondary, fontSize: 10 }
      },
      grid: { left: '3%', right: '4%', bottom: rotar ? '22%' : '14%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: serie.etiquetas,
        boundaryGap: false,
        axisLabel: {
          color: this.colores.textSecondary,
          rotate: rotar ? 45 : 0,
          fontSize: 9,
          interval: this.calcularIntervaloEtiquetas(serie.etiquetas.length)
        },
        axisLine: { lineStyle: { color: '#555' } }
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: {
          color: this.colores.textSecondary,
          formatter: (v: number) => this.formatoEjeGs(v)
        },
        splitLine: { lineStyle: { color: '#444' } }
      },
      series: [
        {
          name: 'Costo promedio',
          type: 'line',
          data: serie.promedios,
          connectNulls: true,
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { color: this.colores.primary, width: 3 },
          itemStyle: { color: this.colores.primary },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(104,159,56,0.35)' },
                { offset: 1, color: 'rgba(104,159,56,0.02)' }
              ]
            }
          }
        },
        {
          name: 'Costo mínimo',
          type: 'line',
          data: serie.minimos.map((v, i) => (serie.promedios[i] == null ? null : v)),
          connectNulls: true,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: this.colores.accent, width: 1, type: 'dashed' }
        },
        {
          name: 'Costo máximo',
          type: 'line',
          data: serie.maximos.map((v, i) => (serie.promedios[i] == null ? null : v)),
          connectNulls: true,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: this.colores.warn, width: 1, type: 'dashed' }
        }
      ]
    };
  }

  private prepararSerieDiaria(costos: ProductoCostoPorPeriodo[], rango: RangoFechas): SerieCosto {
    const mapa = new Map<string, ProductoCostoPorPeriodo>();
    for (const c of costos) {
      mapa.set(this.normalizarFechaPeriodo(c.periodo), c);
    }

    const serie = this.serieVacia();
    const cursor = new Date(rango.inicioDate);
    while (cursor <= rango.finDate) {
      const key = dateToString(cursor, 'yyyy-MM-dd');
      const dia = String(cursor.getDate()).padStart(2, '0');
      const mes = String(cursor.getMonth() + 1).padStart(2, '0');
      serie.etiquetas.push(`${dia}/${mes}`);
      serie.tooltips.push(`${dia}/${mes}/${cursor.getFullYear()}`);
      this.empujarPunto(serie, mapa.get(key));
      cursor.setDate(cursor.getDate() + 1);
    }
    return serie;
  }

  private prepararSerieMensual(costos: ProductoCostoPorPeriodo[], rango: RangoFechas): SerieCosto {
    const mapa = new Map<string, ProductoCostoPorPeriodo>();
    for (const c of costos) {
      mapa.set(c.periodo, c);
    }

    const serie = this.serieVacia();
    const cursor = new Date(rango.inicioDate.getFullYear(), rango.inicioDate.getMonth(), 1);
    const finMes = new Date(rango.finDate.getFullYear(), rango.finDate.getMonth(), 1);
    while (cursor <= finMes) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      serie.etiquetas.push(`${this.meses[cursor.getMonth()].substring(0, 3)} ${cursor.getFullYear()}`);
      serie.tooltips.push(`${this.meses[cursor.getMonth()]} ${cursor.getFullYear()}`);
      this.empujarPunto(serie, mapa.get(key));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return serie;
  }

  private empujarPunto(serie: SerieCosto, dato?: ProductoCostoPorPeriodo): void {
    serie.promedios.push(dato ? dato.costoPromedio : null);
    serie.minimos.push(dato ? dato.costoMinimo : null);
    serie.maximos.push(dato ? dato.costoMaximo : null);
    serie.cantidades.push(dato ? dato.cantidad : 0);
    serie.comprasCount.push(dato ? dato.cantidadCompras : 0);
  }

  private serieVacia(): SerieCosto {
    return { etiquetas: [], tooltips: [], promedios: [], minimos: [], maximos: [], cantidades: [], comprasCount: [] };
  }

  /** Convierte el período crudo del backend (YYYY-MM o YYYY-MM-DD) a etiqueta legible. */
  private formatearPeriodo(periodo: string, vista: VistaTemporal): string {
    if (!periodo || periodo === '-') return '-';
    if (vista === 'mes') {
      const partes = periodo.split('-');
      if (partes.length >= 2) {
        const mesIdx = Number(partes[1]) - 1;
        if (mesIdx >= 0 && mesIdx < 12) return `${this.meses[mesIdx].substring(0, 3)} ${partes[0]}`;
      }
      return periodo;
    }
    const key = this.normalizarFechaPeriodo(periodo);
    const partes = key.split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : periodo;
  }

  private normalizarFechaPeriodo(periodo: string): string {
    if (!periodo) return '';
    const texto = periodo.substring(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
    const d = new Date(periodo);
    if (!isNaN(d.getTime())) return dateToString(d, 'yyyy-MM-dd');
    return texto;
  }

  private calcularIntervaloEtiquetas(total: number): number | 'auto' {
    if (total <= 15) return 0;
    if (total <= 31) return 1;
    if (total <= 60) return 2;
    return Math.floor(total / 20);
  }

  private formatoEjeGs(valor: number): string {
    if (valor >= 1_000_000) return (valor / 1_000_000).toFixed(1) + 'M';
    if (valor >= 1_000) return (valor / 1_000).toFixed(0) + 'k';
    return valor.toString();
  }

  private truncar(texto: string, max: number): string {
    return texto.length > max ? texto.substring(0, max - 2) + '…' : texto;
  }

  limpiarFiltros(): void {
    this.inicializarRangoPorDefecto();
    this.cargarDatos();
  }
}
