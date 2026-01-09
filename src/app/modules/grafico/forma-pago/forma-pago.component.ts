import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, map, tap, combineLatest, startWith, debounceTime, switchMap, finalize, distinctUntilChanged } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormaPagoEstadistica } from '../models/forma-pago-estadistica.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { GraficoService } from '../grafico.service';

interface DetalleProcesado {
  descripcion: string;
  montoFormateado: string;
  cantidadFormateada: string;
  porcentaje: number;
  color: string;
  icono: string;
}

interface DatosGraficoProcesados {
  opciones: EChartsOption;
  detalles: DetalleProcesado[];
  totalMonto: string;
  totalTransacciones: string;
  hayDatos: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'forma-pago',
  templateUrl: './forma-pago.component.html',
  styleUrls: ['./forma-pago.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'forma-pago-host'
  }
})
export class FormaPagoComponent implements OnInit {

  private graficoService = inject(GraficoService);

  private datosSubject = new BehaviorSubject<DatosGraficoProcesados | null>(null);
  datos$: Observable<DatosGraficoProcesados | null> = this.datosSubject.asObservable();

  private sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  sucursales$: Observable<Sucursal[]> = this.sucursalesSubject.asObservable();

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  sucursalControl = new FormControl<number | null>(null);
  anhoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number | null>(new Date().getMonth() + 1);

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
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value), distinctUntilChanged()),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value), distinctUntilChanged())
    ]).pipe(
      debounceTime(300),
      tap(() => this.cargandoSubject.next(true)),
      switchMap(([sucId, anho, mes]) => {
        const { inicio, fin } = this.generarRangoFecha(anho || new Date().getFullYear(), mes);
        return this.graficoService.obtenerEstadisticasFormaPago(inicio, fin, sucId || undefined).pipe(
          map(estadisticas => this.procesarDatos(estadisticas)),
          finalize(() => this.cargandoSubject.next(false))
        );
      }),
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

  private procesarDatos(estadisticas: FormaPagoEstadistica[]): DatosGraficoProcesados {
    const validas = (estadisticas || []).filter(e => e.cantidadTransacciones > 0);
    const totalMontoNum = validas.reduce((sum, e) => sum + (e.totalMonto || 0), 0);
    const totalTransNum = validas.reduce((sum, e) => sum + (e.cantidadTransacciones || 0), 0);

    const detallesProcesados: DetalleProcesado[] = (estadisticas || []).map((e, i) => ({
      descripcion: e.descripcion,
      montoFormateado: `₲ ${e.totalMonto.toLocaleString('es-PY')}`,
      cantidadFormateada: `${e.cantidadTransacciones.toLocaleString('es-PY')} transacciones`,
      porcentaje: e.porcentaje || 0,
      color: this.paletaColores[i % this.paletaColores.length],
      icono: this.obtenerIcono(e.descripcion)
    }));

    const opciones: EChartsOption = {
      title: {
        text: 'Distribución de Formas de Pago',
        subtext: `Total: ₲ ${totalMontoNum.toLocaleString('es-PY')}`,
        left: 'center', top: 10,
        textStyle: { color: this.colores.text, fontSize: 18, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 13 }
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#424242', borderColor: '#555',
        textStyle: { color: this.colores.text },
        formatter: (params: any) => `<strong>${params.name}</strong><br/>Monto: ₲ ${params.value.toLocaleString('es-PY')}<br/>Porcentaje: ${params.percent.toFixed(2)}%`
      },
      legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: this.colores.textSecondary } },
      series: [{
        name: 'Forma de Pago', type: 'pie', radius: ['40%', '70%'], center: ['40%', '55%'],
        itemStyle: { borderRadius: 8, borderColor: this.colores.backgroundDark, borderWidth: 2 },
        label: { show: true, formatter: '{b}: {d}%', color: this.colores.textSecondary },
        data: validas.map((e, i) => ({
          value: e.totalMonto, name: e.descripcion,
          itemStyle: { color: this.paletaColores[i % this.paletaColores.length] }
        }))
      }]
    };

    return {
      opciones,
      detalles: detallesProcesados,
      totalMonto: `₲ ${totalMontoNum.toLocaleString('es-PY')}`,
      totalTransacciones: totalTransNum.toLocaleString('es-PY'),
      hayDatos: totalTransNum > 0
    };
  }

  private obtenerIcono(desc: string): string {
    const iconos: Record<string, string> = {
      'EFECTIVO': 'payments', 'TARJETA': 'credit_card', 'CONVENIO': 'handshake',
      'TRANSFERENCIA': 'account_balance', 'CHEQUE': 'receipt_long'
    };
    return iconos[desc?.toUpperCase()] || 'payment';
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null);
    this.anhoControl.setValue(new Date().getFullYear());
    this.mesControl.setValue(new Date().getMonth() + 1);
  }
}
