import { Component, OnInit, ChangeDetectionStrategy, inject, NgZone, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, forkJoin, map, tap, combineLatest, startWith, debounceTime } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { FormaPagoEstadistica } from '../models/forma-pago-estadistica.model';
import { FormaPagoEstadisticasConFiltrosGQL } from '../graphql/forma-pago-estadisticas-con-filtros.gql';
import { SucursalService } from '../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';

interface DatosGraficoProcesados {
  opciones: EChartsOption;
  detalles: FormaPagoEstadistica[];
  totalMonto: number;
  totalTransacciones: number;
}
interface OpcionMes {
  valor: number;
  nombre: string;
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
export class FormaPagoComponent implements OnInit, AfterViewInit {

  private genericCrudService = inject(GenericCrudService);
  private estadisticasGQL = inject(FormaPagoEstadisticasConFiltrosGQL);
  private sucursalService = inject(SucursalService);
  private ngZone = inject(NgZone);

  private datosSubject = new BehaviorSubject<DatosGraficoProcesados | null>(null);
  datos$: Observable<DatosGraficoProcesados | null> = this.datosSubject.asObservable();

  private sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  sucursales$: Observable<Sucursal[]> = this.sucursalesSubject.asObservable();

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  sucursalControl = new FormControl<number | null>(null);
  anhoControl = new FormControl<number>(new Date().getFullYear());
  mesControl = new FormControl<number | null>(new Date().getMonth() + 1);
  meses: OpcionMes[] = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  anhos: number[] = [];

  private colores = {
    primary: '#689F38',
    primaryLight: '#8BC34A',
    primaryDark: '#558B2F',
    accent: '#009688',
    accentLight: '#4DB6AC',
    warn: '#F44336',
    warnLight: '#EF5350',
    background: '#424242',
    backgroundDark: '#303030',
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    success: '#4CAF50',
    warning: '#FF9800',
    info: '#2196F3'
  };

  private paletaColores = [
    '#689F38',
    '#009688',
    '#FF9800',
    '#2196F3',
    '#4DB6AC',
    '#E91E63',
    '#9C27B0',
    '#00BCD4'
  ];

  ngOnInit(): void {
    this.inicializarAnhos();
    this.cargarSucursales();
  }

  ngAfterViewInit(): void {
    // Retrasar la carga para dar prioridad al renderizado del DOM inicial
    setTimeout(() => {
      this.configurarFiltros();
    }, 150);
  }

  private inicializarAnhos(): void {
    const anhoActual = new Date().getFullYear();
    this.anhos = [];
    for (let i = 0; i < 5; i++) {
      this.anhos.push(anhoActual - i);
    }
  }

  private cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales(true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (sucursales) => {
          const sucursalesFiltradas = (sucursales || []).filter(s =>
            s.activo && s.id > 0 && s.id !== 999
          );
          this.sucursalesSubject.next(sucursalesFiltradas);
        },
        error: (err) => {
          console.error('Error al cargar sucursales:', err);
          this.sucursalesSubject.next([]);
        }
      });
  }

  private configurarFiltros(): void {
    combineLatest([
      this.sucursalControl.valueChanges.pipe(startWith(this.sucursalControl.value)),
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value)),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value))
    ]).pipe(
      debounceTime(250),
      untilDestroyed(this)
    ).subscribe(() => {
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.cargandoSubject.next(true);
    const { inicio, fin } = this.construirRangoFechas();
    const sucursalId = this.sucursalControl.value;

    this.genericCrudService.onCustomQuery(
      this.estadisticasGQL,
      {
        inicio,
        fin,
        sucursalId: sucursalId ? String(sucursalId) : null
      },
      true,
      undefined,
      true
    ).pipe(
      untilDestroyed(this),
      map((estadisticas: FormaPagoEstadistica[]) => this.procesarDatos(estadisticas)),
      tap((datos) => {
        this.datosSubject.next(datos);
        this.cargandoSubject.next(false);
      })
    ).subscribe({
      error: () => this.cargandoSubject.next(false)
    });
  }

  private construirRangoFechas(): { inicio: string | null; fin: string | null } {
    const anho = this.anhoControl.value;
    const mes = this.mesControl.value;

    if (!anho && !mes) {
      return { inicio: null, fin: null };
    }

    const anhoActual = anho || new Date().getFullYear();

    if (mes) {
      const inicioMes = new Date(anhoActual, mes - 1, 1);
      const finMes = new Date(anhoActual, mes, 1);

      return {
        inicio: this.formatearFecha(inicioMes),
        fin: this.formatearFecha(finMes)
      };
    } else {
      const inicioAnho = new Date(anhoActual, 0, 1);
      const finAnho = new Date(anhoActual + 1, 0, 1);

      return {
        inicio: this.formatearFecha(inicioAnho),
        fin: this.formatearFecha(finAnho)
      };
    }
  }
  private formatearFecha(fecha: Date): string {
    const anho = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anho}-${mes}-${dia} 00:00:00`;
  }

  private procesarDatos(estadisticas: FormaPagoEstadistica[]): DatosGraficoProcesados {
    const totalMonto = estadisticas.reduce((sum, e) => sum + (e.totalMonto || 0), 0);
    const totalTransacciones = estadisticas.reduce((sum, e) => sum + (e.cantidadTransacciones || 0), 0);

    const estadisticasConDatos = estadisticas.filter(e => e.cantidadTransacciones > 0);

    const datosGrafico = estadisticasConDatos.map((estadistica, index) => ({
      value: estadistica.totalMonto,
      name: estadistica.descripcion,
      itemStyle: {
        color: this.paletaColores[index % this.paletaColores.length]
      },
      estadistica: estadistica
    }));

    const tituloFiltro = this.construirTituloFiltro();

    const opciones: EChartsOption = {
      title: {
        text: 'Distribución de Formas de Pago',
        subtext: `${tituloFiltro}\nTotal: ₲ ${this.formatearNumero(totalMonto)}`,
        left: 'center',
        top: 10,
        textStyle: {
          color: this.colores.text,
          fontSize: 18,
          fontWeight: 'bold'
        },
        subtextStyle: {
          color: this.colores.textSecondary,
          fontSize: 12,
          lineHeight: 18
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number; data: { estadistica: FormaPagoEstadistica } };
          const est = p.data.estadistica;
          return `<strong>${p.name}</strong><br/>
                            Monto: ₲ ${this.formatearNumero(p.value)}<br/>
                            Transacciones: ${this.formatearNumero(est.cantidadTransacciones)}<br/>
                            Porcentaje: ${p.percent?.toFixed(2) || est.porcentaje?.toFixed(2)}%`;
        },
        backgroundColor: '#424242',
        borderColor: '#555',
        textStyle: {
          color: this.colores.text
        }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          color: this.colores.textSecondary,
          fontSize: 12
        }
      },
      series: [{
        name: 'Forma de Pago',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: this.colores.backgroundDark,
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {d}%',
          color: this.colores.textSecondary,
          fontSize: 11
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: this.colores.text
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: true,
          lineStyle: {
            color: this.colores.textSecondary
          }
        },
        data: datosGrafico
      }]
    };

    return {
      opciones,
      detalles: estadisticas,
      totalMonto,
      totalTransacciones
    };
  }

  private construirTituloFiltro(): string {
    const partes: string[] = [];

    const mes = this.mesControl.value;
    const anho = this.anhoControl.value;

    if (mes) {
      const mesNombre = this.meses.find(m => m.valor === mes)?.nombre || '';
      partes.push(mesNombre);
    }

    if (anho) {
      partes.push(String(anho));
    }

    return partes.length > 0 ? partes.join(' ') : 'Todos los períodos';
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null, { emitEvent: false });
    this.anhoControl.setValue(new Date().getFullYear(), { emitEvent: false });
    this.mesControl.setValue(null, { emitEvent: false });
    this.cargarDatos();
  }

  formatearNumero(valor: number): string {
    return valor?.toLocaleString('es-PY') || '0';
  }

  formatearMoneda(valor: number): string {
    return '₲ ' + this.formatearNumero(valor);
  }

  obtenerColor(indice: number): string {
    return this.paletaColores[indice % this.paletaColores.length];
  }

  obtenerIcono(descripcion: string): string {
    const iconos: Record<string, string> = {
      'EFECTIVO': 'payments',
      'TARJETA': 'credit_card',
      'CONVENIO': 'handshake',
      'TRANSFERENCIA': 'account_balance',
      'CHEQUE': 'receipt_long'
    };
    return iconos[descripcion?.toUpperCase()] || 'payment';
  }
}
