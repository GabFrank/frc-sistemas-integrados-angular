import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, map, tap, combineLatest, startWith, debounceTime, forkJoin, switchMap, finalize, distinctUntilChanged } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VentaPorPeriodo } from '../models/venta-por-periodo.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { GraficoService } from '../grafico.service';

interface ResumenAnho {
  label: string;
  valor: string;
}

interface DatosGraficoProcesados {
  opciones: EChartsOption;
  resumen: ResumenAnho[];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'venta-mes',
  templateUrl: './venta-mes.component.html',
  styleUrls: ['./venta-mes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'venta-mes-host'
  }
})
export class VentaMesComponent implements OnInit {

  private graficoService = inject(GraficoService);

  private datosSubject = new BehaviorSubject<DatosGraficoProcesados | null>(null);
  datos$: Observable<DatosGraficoProcesados | null> = this.datosSubject.asObservable();

  private sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  sucursales$: Observable<Sucursal[]> = this.sucursalesSubject.asObservable();

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  sucursalControl = new FormControl<number | null>(null);
  anhoControl = new FormControl<number>(new Date().getFullYear());

  anhos: number[] = [];

  private colores = {
    primary: '#689F38',
    accent: '#009688',
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    background: '#424242',
    lineas: '#555'
  };

  ngOnInit(): void {
    this.inicializarAnhos();
    setTimeout(() => {
      this.cargarSucursales();
      this.configurarDataStream();
    }, 100);
  }

  private inicializarAnhos(): void {
    const anhoActual = new Date().getFullYear();
    this.anhos = Array.from({ length: 5 }, (_, i) => anhoActual - i);
  }

  private cargarSucursales(): void {
    this.graficoService.obtenerSucursales()
      .pipe(
        untilDestroyed(this),
        map(sucs => (sucs || []).filter(s => s.activo && s.id > 0 && s.id !== 999))
      )
      .subscribe(sucs => this.sucursalesSubject.next(sucs));
  }

  private configurarDataStream(): void {
    combineLatest([
      this.sucursalControl.valueChanges.pipe(startWith(this.sucursalControl.value), distinctUntilChanged()),
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value), distinctUntilChanged())
    ]).pipe(
      debounceTime(300),
      tap(() => this.cargandoSubject.next(true)),
      switchMap(([sucId, anho]) => {
        const actual = anho || new Date().getFullYear();
        const anterior = actual - 1;

        return forkJoin([
          this.graficoService.obtenerVentasPorPeriodo(`${actual}-01-01T00:00:00`, `${actual + 1}-01-01T00:00:00`, sucId || undefined),
          this.graficoService.obtenerVentasPorPeriodo(`${anterior}-01-01T00:00:00`, `${anterior + 1}-01-01T00:00:00`, sucId || undefined)
        ]).pipe(
          map(([dataActual, dataAnterior]) => this.procesarDatos(dataActual, dataAnterior, actual, anterior)),
          finalize(() => this.cargandoSubject.next(false))
        );
      }),
      untilDestroyed(this)
    ).subscribe(datos => this.datosSubject.next(datos));
  }

  private procesarDatos(
    actual: VentaPorPeriodo[],
    anterior: VentaPorPeriodo[],
    anhoActual: number,
    anhoAnterior: number
  ): DatosGraficoProcesados {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const agruparPorMes = (datos: VentaPorPeriodo[]) => {
      const totales = new Array(12).fill(0);
      (datos || []).forEach(d => {
        const mes = new Date(d.creadoEn).getMonth();
        totales[mes] += d.valorTotalGs || 0;
      });
      return totales;
    };

    const serieActual = agruparPorMes(actual);
    const serieAnterior = agruparPorMes(anterior);
    const totalActual = serieActual.reduce((a, b) => a + b, 0);
    const totalAnterior = serieAnterior.reduce((a, b) => a + b, 0);

    const opciones: EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        text: 'Evolución de Ventas Mensual',
        left: 'center', top: 0,
        textStyle: { color: this.colores.text, fontSize: 18, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: this.colores.background,
        borderColor: this.colores.lineas,
        textStyle: { color: this.colores.text },
        formatter: (params: any) => {
          let res = `<strong>${params[0].name}</strong><br/>`;
          params.forEach((p: any) => {
            res += `${p.marker} ${p.seriesName}: ₲ ${p.value.toLocaleString('es-PY')}<br/>`;
          });
          return res;
        }
      },
      legend: { bottom: 0, textStyle: { color: this.colores.textSecondary } },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category', boundaryGap: false, data: meses,
        axisLine: { lineStyle: { color: this.colores.lineas } },
        axisLabel: { color: this.colores.textSecondary }
      },
      yAxis: {
        type: 'value', axisLine: { show: false },
        axisLabel: {
          color: this.colores.textSecondary,
          formatter: (v: number) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v.toString()
        },
        splitLine: { lineStyle: { color: this.colores.lineas } }
      },
      series: [
        {
          name: anhoAnterior.toString(), type: 'line', smooth: true, data: serieAnterior,
          symbolSize: 8, lineStyle: { width: 3, color: this.colores.primary },
          itemStyle: { color: this.colores.primary }
        },
        {
          name: anhoActual.toString(), type: 'line', smooth: true, data: serieActual,
          symbolSize: 8, lineStyle: { width: 3, color: this.colores.accent },
          itemStyle: { color: this.colores.accent }
        }
      ]
    };

    return {
      opciones,
      resumen: [
        { label: `Total ${anhoActual}`, valor: `₲ ${totalActual.toLocaleString('es-PY')}` },
        { label: `Total ${anhoAnterior}`, valor: `₲ ${totalAnterior.toLocaleString('es-PY')}` }
      ]
    };
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null);
    this.anhoControl.setValue(new Date().getFullYear());
  }
}
