import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, map, tap, combineLatest, startWith } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { ProductoVendidoEstadistica } from '../models/producto-vendido-estadistica.model';
import { ProductosMasVendidosGQL } from '../graphql/productos-mas-vendidos.gql';
import { SucursalService } from '../../empresarial/sucursal/sucursal.service';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';

interface DatosGraficoProcesados {
  opciones: EChartsOption;
  detalles: ProductoVendidoEstadistica[];
  totalMonto: number;
  totalCantidad: number;
}

interface OpcionMes {
  valor: number;
  nombre: string;
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

  private genericCrudService = inject(GenericCrudService);
  private estadisticasGQL = inject(ProductosMasVendidosGQL);
  private sucursalService = inject(SucursalService);
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
    accent: '#009688',
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    background: '#424242',
    backgroundDark: '#303030'
  };

  private paletaColores = [
    '#689F38', '#009688', '#FF9800', '#2196F3', '#4DB6AC', '#E91E63', '#9C27B0', '#00BCD4', '#F44336', '#FFC107'
  ];

  ngOnInit(): void {
    this.inicializarAnhos();
    this.cargarSucursales();
    this.configurarFiltros();
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
        }
      });
  }

  private configurarFiltros(): void {
    combineLatest([
      this.sucursalControl.valueChanges.pipe(startWith(this.sucursalControl.value)),
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value)),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value))
    ]).pipe(
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
        limit: 10,
        sucursalId: sucursalId ? String(sucursalId) : null
      },
      true,
      undefined,
      true
    ).pipe(
      untilDestroyed(this),
      map((estadisticas: ProductoVendidoEstadistica[]) => this.procesarDatos(estadisticas)),
      tap((datos) => {
        this.datosSubject.next(datos);
        this.cargandoSubject.next(false);
      })
    ).subscribe({
      error: () => this.cargandoSubject.next(false)
    });
  }

  private construirRangoFechas(): { inicio: string; fin: string } {
    const anho = this.anhoControl.value || new Date().getFullYear();
    const mes = this.mesControl.value;

    if (mes) {
      const inicioMes = new Date(anho, mes - 1, 1);
      const finMes = new Date(anho, mes, 1);
      return {
        inicio: this.formatearFecha(inicioMes),
        fin: this.formatearFecha(finMes)
      };
    } else {
      const inicioAnho = new Date(anho, 0, 1);
      const finAnho = new Date(anho + 1, 0, 1);
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

  private procesarDatos(estadisticas: ProductoVendidoEstadistica[]): DatosGraficoProcesados {
    const totalMonto = estadisticas.reduce((sum, e) => sum + (e.totalMonto || 0), 0);
    const totalCantidad = estadisticas.reduce((sum, e) => sum + (e.cantidad || 0), 0);

    const dataGrafico = estadisticas.map((est, index) => ({
      value: est.totalMonto,
      name: est.descripcion,
      itemStyle: { color: this.paletaColores[index % this.paletaColores.length] },
      estadistica: est
    }));

    const tituloFiltro = this.construirTituloFiltro();

    const opciones: EChartsOption = {
      title: {
        text: 'Top 10 Productos más Vendidos',
        subtext: `${tituloFiltro}\nTotal: ₲ ${this.formatearNumero(totalMonto)}`,
        left: 'center',
        top: 10,
        textStyle: { color: this.colores.text, fontSize: 18, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 12, lineHeight: 18 }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const est = params.data.estadistica;
          return `<strong>${params.name}</strong><br/>
                            Monto: ₲ ${this.formatearNumero(params.value)}<br/>
                            Cantidad: ${this.formatearNumero(est.cantidad)}<br/>
                            Porcentaje: ${params.percent?.toFixed(2)}%`;
        },
        backgroundColor: '#424242',
        borderColor: '#555',
        textStyle: { color: this.colores.text }
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'middle',
        textStyle: { color: this.colores.textSecondary, fontSize: 11 }
      },
      series: [{
        name: 'Producto',
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: this.colores.backgroundDark, borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold', color: this.colores.text } },
        data: dataGrafico
      }]
    };

    return { opciones, detalles: estadisticas, totalMonto, totalCantidad };
  }

  private construirTituloFiltro(): string {
    const mes = this.mesControl.value;
    const anho = this.anhoControl.value;
    const nombreMes = mes ? this.meses.find(m => m.valor === mes)?.nombre : '';
    return `${nombreMes} ${anho}`.trim() || 'Todos los períodos';
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null, { emitEvent: false });
    this.anhoControl.setValue(new Date().getFullYear(), { emitEvent: false });
    this.mesControl.setValue(new Date().getMonth() + 1, { emitEvent: false });
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
}
