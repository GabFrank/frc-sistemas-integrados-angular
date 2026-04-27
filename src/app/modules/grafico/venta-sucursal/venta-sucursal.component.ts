
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, map, startWith, distinctUntilChanged, debounceTime, switchMap, finalize, tap, combineLatest } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GraficoService } from '../grafico.service';

interface DatosGraficoProcesados {
  opciones: EChartsOption;
  hayDatos: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-venta-sucursal',
  templateUrl: './venta-sucursal.component.html',
  styleUrls: ['./venta-sucursal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentaSucursalComponent implements OnInit {

  private graficoService = inject(GraficoService);

  private datosSubject = new BehaviorSubject<DatosGraficoProcesados | null>(null);
  datos$: Observable<DatosGraficoProcesados | null> = this.datosSubject.asObservable();

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  anhoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number | null>(new Date().getMonth() + 1);
  fechaControl = new FormControl<Date | null>(null);

  meses = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' }, { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' }, { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' }, { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' }, { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
  ];

  anhos: number[] = [];
  private allData: any[] = [];

  private colores = {
    primary: '#8BC34A', // Light green from chart
    primaryDark: '#558B2F',
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    background: '#424242'
  };

  ngOnInit(): void {
    this.inicializarAnhos();

    setTimeout(() => {
      this.configurarDataStream();
    }, 100);

    this.mesControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.fechaControl.setValue(null, { emitEvent: false }));
    this.anhoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.fechaControl.setValue(null, { emitEvent: false }));
  }

  private inicializarAnhos(): void {
    const anhoActual = new Date().getFullYear();
    this.anhos = Array.from({ length: 5 }, (_, i) => anhoActual - i);
  }

  private configurarDataStream(): void {
    combineLatest([
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value), distinctUntilChanged()),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value), distinctUntilChanged()),
      this.fechaControl.valueChanges.pipe(startWith(this.fechaControl.value), distinctUntilChanged())
    ]).pipe(
      debounceTime(300),
      tap(() => this.cargandoSubject.next(true)),
      switchMap(([anho, mes, fechaDia]) => {
        const { inicio, fin } = this.generarRangoFecha(anho || new Date().getFullYear(), mes, fechaDia);
        // We don't filter by branch here because we want ALL branches
        return this.graficoService.obtenerVentasPorSucursal(inicio, fin).pipe(
          finalize(() => this.cargandoSubject.next(false))
        );
      }),
      untilDestroyed(this)
    ).subscribe(datos => {
      this.allData = datos || [];
      this.actualizarGrafico();
    });
  }

  private actualizarGrafico() {
    const data = this.procesarDatos(this.allData);
    this.datosSubject.next(data);
  }

  limpiarFiltros(): void {
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue(new Date().getMonth() + 1);
    this.fechaControl.setValue(null);
  }

  private generarRangoFecha(anho: number, mes: number | null, fechaDia: Date | null = null): { inicio: string; fin: string } {
    if (fechaDia) {
      const inicio = this.formatDate(fechaDia) + ' 00:00';
      const nextDay = new Date(fechaDia);
      nextDay.setDate(fechaDia.getDate() + 1);
      const fin = this.formatDate(nextDay) + ' 00:00';
      return { inicio, fin };
    }

    if (mes) {
      const inicio = `${anho}-${String(mes).padStart(2, '0')}-01 00:00`;
      const fechaFin = new Date(anho, mes, 0); // Last day of month
      const fin = `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}-${String(fechaFin.getDate()).padStart(2, '0')} 23:59`;
      // Logic fix: creating the next month 0th day gives the last day of current month.
      // But string construction needs care.
      // Better:
      const d = new Date(anho, mes, 0);
      // mes is 1-indexed in our array (1=Jan). Date constructor takes 0-indexed month for the next parameter if using day 0? 
      // new Date(2023, 1, 0) -> Jan 31 2023.
      // So if mes=1 (Jan), new Date(anho, mes, 0) is correct for end of Jan.
      return {
        inicio: `${anho}-${String(mes).padStart(2, '0')}-01 00:00`,
        fin: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} 23:59`
      };
    } else {
      return { inicio: `${anho}-01-01 00:00`, fin: `${anho}-12-31 23:59` };
    }
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private procesarDatos(data: any[]): DatosGraficoProcesados {
    const validas = (data || []).sort((a, b) => (b.total || 0) - (a.total || 0));

    // Sort logic? Image doesn't clearly show sort order, but maybe by value? or fixed order?
    // Let's sort by value descending or keep original?
    // User requested "detailed data".
    // Let's assume sorting by total is best.

    const totalGeneral = validas.reduce((sum, item) => sum + (item.total || 0), 0);
    const titulo = 'Ventas por Sucursal';

    const opciones: EChartsOption = {
      title: {
        text: titulo,
        subtext: `Total Período: ₲ ${totalGeneral.toLocaleString('es-PY')}`,
        left: 'center',
        textStyle: { color: this.colores.text, fontSize: 18, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>
                   Ventas: ₲ ${Number(p.value).toLocaleString('es-PY')}`;
        }
      },
      grid: {
        left: '3%', right: '4%', bottom: '15%', containLabel: true
      },
      xAxis: {
        type: 'category',
        data: validas.map(v => v.nombre || `Suc ${v.sucId}`),
        axisLabel: {
          color: this.colores.textSecondary,
          rotate: 30,
          interval: 0
        },
        axisLine: { lineStyle: { color: '#555' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: this.colores.textSecondary,
          formatter: (value: number) => {
            if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'KM'; // Billions?
            if (value >= 1_000_000) return (value / 1_000_000).toFixed(0) + 'M';
            if (value >= 1_000) return (value / 1_000).toFixed(0) + 'k';
            return value.toString();
          }
        },
        splitLine: { lineStyle: { color: '#444' } }
      },
      series: [
        {
          name: 'Ventas',
          type: 'bar',
          data: validas.map(v => v.total),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: this.colores.primary }, // Lighter
                { offset: 1, color: this.colores.primaryDark } // Darker
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            color: this.colores.text,
            formatter: (params: any) => {
              const val = Number(params.value);
              if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
              return val.toLocaleString('es-PY');
            }
          }
        }
      ]
    };

    return { opciones, hayDatos: validas.length > 0 };
  }
}
