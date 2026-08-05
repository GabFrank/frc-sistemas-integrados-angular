import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Familia } from '../../productos/familia/familia.model';
import { GraficoService } from '../grafico.service';
import { dateToString } from '../../../commons/core/utils/dateUtils';
import { formatoMonedaPy } from '../../../shared/utils/grafico-echarts.theme';
import { RankingInflacionItem } from './interfaces/ranking-inflacion-item.model';
import {
  RankingInflacionFilaVista,
  RankingInflacionVista
} from './interfaces/ranking-inflacion-vista.model';

type OrdenInflacion = 'suba' | 'baja';

interface RangoFechas {
  inicio: string;
  fin: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'ranking-inflacion',
  templateUrl: './ranking-inflacion.component.html',
  styleUrls: ['./ranking-inflacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ranking-inflacion-host' }
})
export class RankingInflacionComponent implements OnInit {

  private graficoService = inject(GraficoService);
  private cdr = inject(ChangeDetectorRef);

  private datosSubject = new BehaviorSubject<RankingInflacionVista | null>(null);
  datos$: Observable<RankingInflacionVista | null> = this.datosSubject.asObservable();

  private familiasSubject = new BehaviorSubject<Familia[]>([]);
  familias$: Observable<Familia[]> = this.familiasSubject.asObservable();

  cargando = false;

  // El costo se registra de forma global (no por sucursal), por eso no hay filtro de sucursal.
  familiaControl = new FormControl<number | null>(null);
  limitControl = new FormControl<number>(20);
  ordenControl = new FormControl<OrdenInflacion>('suba');

  fechaRangoGroup = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null)
  });

  limits = [10, 15, 20, 30, 50];
  ordenes: { valor: OrdenInflacion; label: string }[] = [
    { valor: 'suba', label: 'Mayor suba' },
    { valor: 'baja', label: 'Mayor baja' }
  ];

  private colores = {
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    primary: '#689F38',
    warn: '#F44336'
  };

  ngOnInit(): void {
    this.inicializarRangoPorDefecto();
    this.cargarMetadata();
    this.cargarDatos();
  }

  private inicializarRangoPorDefecto(): void {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
    this.fechaRangoGroup.setValue({ inicio, fin: hoy }, { emitEvent: false });
  }

  private cargarMetadata(): void {
    this.graficoService.obtenerFamilias().pipe(
      untilDestroyed(this),
      catchError(() => of([]))
    ).subscribe(fams => this.familiasSubject.next(fams));
  }

  /** Aplica los filtros manualmente (botón Filtrar). */
  filtrar(): void {
    this.cargarDatos();
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
      fin: `${dateToString(finExclusive, 'yyyy-MM-dd')} 00:00:00`
    };
  }

  private cargarDatos(): void {
    const rango = this.obtenerRangoFechas();
    if (!rango) return;

    this.cargando = true;
    this.cdr.markForCheck();

    const famId = this.familiaControl.value || undefined;
    const limit = this.limitControl.value || 20;
    const orden = this.ordenControl.value || 'suba';

    this.graficoService.obtenerRankingInflacionCosto(rango.inicio, rango.fin, limit, orden, undefined, famId).pipe(
      catchError(() => of([] as RankingInflacionItem[])),
      untilDestroyed(this)
    ).subscribe(items => {
      this.cargando = false;
      this.datosSubject.next(this.construirVista(items || [], orden));
      this.cdr.markForCheck();
    });
  }

  private construirVista(items: RankingInflacionItem[], orden: OrdenInflacion): RankingInflacionVista {
    const filas: RankingInflacionFilaVista[] = items.map((item, i) => ({
      productoId: item.productoId,
      descripcion: item.descripcion,
      costoInicial: formatoMonedaPy(Math.round(item.costoInicial)),
      costoFinal: formatoMonedaPy(Math.round(item.costoFinal)),
      variacion: `${item.variacionPorcentual >= 0 ? '+' : ''}${item.variacionPorcentual.toFixed(1)}%`,
      variacionPositiva: item.variacionPorcentual > 0,
      totalCompras: item.totalCompras,
      rank: i + 1
    }));

    const titulo = orden === 'suba'
      ? 'Productos con mayor suba de costo'
      : 'Productos con mayor baja de costo';

    return {
      chartOptions: this.construirChart(items, titulo),
      filas,
      hayDatos: filas.length > 0,
      titulo
    };
  }

  private construirChart(items: RankingInflacionItem[], titulo: string): EChartsOption {
    // Barras horizontales: el ítem con mayor variación arriba (ECharts dibuja de abajo hacia arriba).
    const invertidos = [...items].reverse();
    const nombres = invertidos.map(i => this.truncar(i.descripcion, 45));
    const valores = invertidos.map(i => Number(i.variacionPorcentual.toFixed(1)));

    return {
      title: {
        text: titulo,
        subtext: 'Variación % entre el primer y último mes con compras',
        left: 'center',
        textStyle: { color: this.colores.text, fontSize: 15, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 11 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0;
          const item = invertidos[idx];
          return `<strong>${item.descripcion}</strong><br/>
            Costo inicial: ${formatoMonedaPy(Math.round(item.costoInicial))}<br/>
            Costo final: ${formatoMonedaPy(Math.round(item.costoFinal))}<br/>
            Variación: ${item.variacionPorcentual >= 0 ? '+' : ''}${item.variacionPorcentual.toFixed(1)}%<br/>
            Compras: ${item.totalCompras}`;
        }
      },
      grid: { left: 8, right: '10%', bottom: '5%', top: '16%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: this.colores.textSecondary,
          formatter: (v: number) => `${v}%`
        },
        splitLine: { lineStyle: { color: '#444' } }
      },
      yAxis: {
        type: 'category',
        data: nombres,
        // margin: pequeño respiro entre el nombre y la barra (el ancho lo reserva containLabel).
        axisLabel: { color: this.colores.textSecondary, fontSize: 10, margin: 14 }
      },
      series: [
        {
          name: 'Variación',
          type: 'bar',
          data: valores.map(v => ({
            value: v,
            itemStyle: {
              color: v >= 0 ? this.colores.warn : this.colores.primary,
              borderRadius: v >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4]
            }
          })),
          label: {
            show: true,
            position: 'right',
            color: this.colores.textSecondary,
            fontSize: 10,
            formatter: (p: any) => `${p.value >= 0 ? '+' : ''}${p.value}%`
          }
        }
      ]
    };
  }

  private truncar(texto: string, max: number): string {
    return texto.length > max ? texto.substring(0, max - 2) + '…' : texto;
  }

  trackByProductoId(_: number, item: RankingInflacionFilaVista): number {
    return item.productoId;
  }

  limpiarFiltros(): void {
    this.familiaControl.setValue(null);
    this.limitControl.setValue(20);
    this.ordenControl.setValue('suba');
    this.inicializarRangoPorDefecto();
    this.cargarDatos();
  }
}
