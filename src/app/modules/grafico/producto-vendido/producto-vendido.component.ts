import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, map, tap, combineLatest, startWith, debounceTime, switchMap, finalize, distinctUntilChanged, shareReplay } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProductoVendidoEstadistica } from '../models/producto-vendido-estadistica.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Familia } from '../../productos/familia/familia.model';
import { GraficoService } from '../grafico.service';

interface DetalleProcesado {
  descripcion: string;
  montoFormateado: string;
  cantidadFormateada: string;
  color: string;
  oculto: boolean;
}

interface DatosGraficoProcesados {
  opciones: EChartsOption;
  detalles: DetalleProcesado[];
  totalMonto: string;
  hayDatos: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'producto-vendido',
  templateUrl: './producto-vendido.component.html',
  styleUrls: ['./producto-vendido.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'producto-vendido-host'
  }
})
export class ProductoVendidoComponent implements OnInit {

  private graficoService = inject(GraficoService);

  private datosSubject = new BehaviorSubject<DatosGraficoProcesados | null>(null);
  datos$: Observable<DatosGraficoProcesados | null> = this.datosSubject.asObservable();

  private sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  sucursales$: Observable<Sucursal[]> = this.sucursalesSubject.asObservable();

  private familiasSubject = new BehaviorSubject<Familia[]>([]);
  familias$: Observable<Familia[]> = this.familiasSubject.asObservable();

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  private indicesOcultosSubject = new BehaviorSubject<Set<number>>(new Set());
  indicesOcultos$ = this.indicesOcultosSubject.asObservable();

  sucursalControl = new FormControl<number | null>(null);
  anhoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number | null>(new Date().getMonth() + 1);
  familiaControl = new FormControl<number | null>(null);
  limitControl = new FormControl<number>(10);

  limits = [10, 30, 50, 100];

  meses = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' }, { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' }, { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' }, { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' }, { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
  ];

  anhos: number[] = [];

  private colores = {
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    background: '#424242',
    backgroundDark: '#303030'
  };

  private paletaColores = ['#689F38', '#009688', '#FF9800', '#2196F3', '#4DB6AC', '#E91E63', '#9C27B0', '#00BCD4'];

  ngOnInit(): void {
    this.inicializarAnhos();

    // Diferir la carga de datos para no bloquear el renderizado inicial
    setTimeout(() => {
      this.cargarMetadata();
      this.configurarDataStream();
    }, 100);
  }

  private inicializarAnhos(): void {
    const anhoActual = new Date().getFullYear();
    this.anhos = Array.from({ length: 5 }, (_, i) => anhoActual - i);
  }

  private cargarMetadata(): void {
    this.graficoService.obtenerSucursales().pipe(
      untilDestroyed(this),
      map(sucs => (sucs || []).filter(s => s.activo && s.id > 0 && s.id !== 999))
    ).subscribe(sucs => this.sucursalesSubject.next(sucs));

    this.graficoService.obtenerFamilias().pipe(
      untilDestroyed(this)
    ).subscribe(fams => this.familiasSubject.next(fams));
  }

  private configurarDataStream(): void {
    const filtros$ = combineLatest([
      this.sucursalControl.valueChanges.pipe(startWith(this.sucursalControl.value), distinctUntilChanged()),
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value), distinctUntilChanged()),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value), distinctUntilChanged()),
      this.familiaControl.valueChanges.pipe(startWith(this.familiaControl.value), distinctUntilChanged()),
      this.limitControl.valueChanges.pipe(startWith(this.limitControl.value), distinctUntilChanged())
    ]).pipe(debounceTime(300));

    const estadisticas$ = filtros$.pipe(
      tap(() => {
        this.cargandoSubject.next(true);
        this.indicesOcultosSubject.next(new Set());
      }),
      switchMap(([sucId, anho, mes, famId, limit]) => {
        const { inicio, fin } = this.generarRangoFecha(anho || new Date().getFullYear(), mes);
        return this.graficoService.obtenerProductosMasVendidos(inicio, fin, sucId || undefined, famId || undefined, limit || 10).pipe(
          finalize(() => this.cargandoSubject.next(false))
        );
      }),
      shareReplay(1)
    );

    combineLatest([estadisticas$, this.indicesOcultosSubject]).pipe(
      map(([estadisticas, indicesOcultos]) => this.procesarDatos(estadisticas, indicesOcultos)),
      untilDestroyed(this)
    ).subscribe(datos => this.datosSubject.next(datos));
  }

  private generarRangoFecha(anho: number, mes: number | null): { inicio: string; fin: string } {
    if (mes) {
      const inicio = `${anho}-${String(mes).padStart(2, '0')}-01 00:00:00`;
      const fechaFin = new Date(anho, mes, 1);
      const fin = `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}-01 00:00:00`;
      return { inicio, fin };
    } else {
      return { inicio: `${anho}-01-01 00:00:00`, fin: `${anho + 1}-01-01 00:00:00` };
    }
  }

  private procesarDatos(estadisticas: ProductoVendidoEstadistica[], indicesOcultos: Set<number>): DatosGraficoProcesados {
    const validasTotal = (estadisticas || []).filter(e => e.cantidad > 0);
    
    const detallesProcesados: DetalleProcesado[] = (estadisticas || []).map((e, i) => ({
      descripcion: e.descripcion,
      montoFormateado: `₲ ${e.totalMonto.toLocaleString('es-PY')}`,
      cantidadFormateada: `${e.cantidad.toLocaleString('es-PY')} unidades`,
      color: this.paletaColores[i % this.paletaColores.length],
      oculto: indicesOcultos.has(i)
    }));

    const datosParaGrafico = (estadisticas || []).filter((e, i) => e.cantidad > 0 && !indicesOcultos.has(i));
    const totalMontoNum = datosParaGrafico.reduce((sum, e) => sum + (e.totalMonto || 0), 0);

    const opciones: EChartsOption = {
      title: {
        text: 'Top 10 Productos más Vendidos',
        subtext: `Total: ₲ ${totalMontoNum.toLocaleString('es-PY')}`,
        left: 'center', top: 10,
        textStyle: { color: this.colores.text, fontSize: 18, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 12 }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#424242', borderColor: '#555',
        textStyle: { color: this.colores.text },
        formatter: (params: any) => `<strong>${params.name}</strong><br/>Monto: ₲ ${params.value.toLocaleString('es-PY')}<br/>Porcentaje: ${params.percent.toFixed(2)}%`
      },
      legend: { show: false }, // Ocultamos la leyenda nativa ya que usamos las tarjetas
      series: [{
        name: 'Producto', type: 'pie', radius: ['35%', '65%'], center: ['50%', '55%'], // Ajuste center para dejar más espacio al gráfico
        itemStyle: { borderRadius: 6, borderColor: this.colores.backgroundDark, borderWidth: 2 },
        label: { show: false },
        data: (estadisticas || []).map((e, i) => {
          if (e.cantidad <= 0 || indicesOcultos.has(i)) return null;
          return {
            value: e.totalMonto, 
            name: e.descripcion,
            itemStyle: { color: this.paletaColores[i % this.paletaColores.length] }
          };
        }).filter(item => item !== null)
      }]
    };

    return { opciones, detalles: detallesProcesados, totalMonto: `₲ ${totalMontoNum.toLocaleString('es-PY')}`, hayDatos: validasTotal.length > 0 };
  }

  toggleItem(index: number): void {
    const nuevosIndices = new Set(this.indicesOcultosSubject.value);
    if (nuevosIndices.has(index)) {
      nuevosIndices.delete(index);
    } else {
      nuevosIndices.add(index);
    }
    this.indicesOcultosSubject.next(nuevosIndices);
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null);
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue(new Date().getMonth() + 1);
    this.familiaControl.setValue(null);
    this.limitControl.setValue(10);
  }
}
