import { Component, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { EChartsOption } from 'echarts';
import {
  BehaviorSubject, Observable, combineLatest, startWith, debounceTime,
  switchMap, distinctUntilChanged, tap, map, of, catchError, forkJoin
} from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProductoVendidoEstadistica } from '../models/producto-vendido-estadistica.model';
import { ProductoVentaPorPeriodo } from '../models/producto-venta-periodo.model';
import { ProductoCompraPorPeriodo } from '../models/producto-compra-periodo.model';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { Familia } from '../../productos/familia/familia.model';
import { MatDialog } from '@angular/material/dialog';
import { GraficoService } from '../grafico.service';
import { Producto } from '../../productos/producto/producto.model';
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData
} from '../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { dateToString } from '../../../commons/core/utils/dateUtils';

type ModoRanking = 'mas' | 'menos';
type NivelVenta = 'alto' | 'medio' | 'bajo';
type VistaTemporal = 'dia' | 'mes';

interface ProductoDetalle {
  productoId: string;
  descripcion: string;
  cantidad: number;
  totalMonto: number;
  cantidadFormateada: string;
  montoFormateado: string;
  porcentaje: number;
  nivel: NivelVenta;
  nivelLabel: string;
  color: string;
  rank: number;
}

interface VistaAnalisis {
  rankingOptions: EChartsOption;
  temporalOptions: EChartsOption;
  productos: ProductoDetalle[];
  productoSeleccionado: ProductoDetalle | null;
  promedioPeriodo: string;
  periodoPico: string;
  labelPeriodoPico: string;
  hayDatos: boolean;
  tituloRanking: string;
}

interface RangoFechas {
  inicio: string;
  fin: string;
  inicioDate: Date;
  finDate: Date;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'analisis-producto',
  templateUrl: './analisis-producto.component.html',
  styleUrls: ['./analisis-producto.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'analisis-producto-host' }
})
export class AnalisisProductoComponent implements OnInit {

  private graficoService = inject(GraficoService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  private datosSubject = new BehaviorSubject<VistaAnalisis | null>(null);
  datos$: Observable<VistaAnalisis | null> = this.datosSubject.asObservable();

  private sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  sucursales$: Observable<Sucursal[]> = this.sucursalesSubject.asObservable();

  private familiasSubject = new BehaviorSubject<Familia[]>([]);
  familias$: Observable<Familia[]> = this.familiasSubject.asObservable();

  cargando = false;

  private productoSeleccionadoId: string | null = null;
  private ultimoRango: RangoFechas | null = null;

  sucursalControl = new FormControl<number | null>(null);
  familiaControl = new FormControl<number | null>(null);
  limitControl = new FormControl<number>(15);
  modoControl = new FormControl<ModoRanking>('mas');
  vistaTemporalControl = new FormControl<VistaTemporal>('dia');
  anhoControl = new FormControl<number>(new Date().getFullYear());
  productosFiltro: Producto[] = [];

  anhos: number[] = [];
  minFechaAnho = new Date(new Date().getFullYear(), 0, 1);
  maxFechaAnho = new Date();

  private ajustandoRango = false;

  fechaRangoGroup = new FormGroup({
    inicio: new FormControl<Date | null>(null),
    fin: new FormControl<Date | null>(null)
  });

  limits = [10, 15, 20, 30, 50, 75, 100];
  modos: { valor: ModoRanking; label: string }[] = [
    { valor: 'mas', label: 'Más vendidos' },
    { valor: 'menos', label: 'Menos vendidos' }
  ];
  vistasTemporales: { valor: VistaTemporal; label: string }[] = [
    { valor: 'dia', label: 'Por día' },
    { valor: 'mes', label: 'Por mes' }
  ];

  meses = [
    { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' }, { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' }, { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' }, { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' }, { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
  ];

  private colores = {
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    primary: '#689F38',
    accent: '#009688',
    warn: '#F44336',
    warning: '#FF9800'
  };

  private paleta = ['#689F38', '#009688', '#FF9800', '#2196F3', '#4DB6AC', '#E91E63', '#9C27B0', '#00BCD4'];

  ngOnInit(): void {
    this.inicializarAnhos();
    this.inicializarRangoPorDefecto();
    this.configurarSincronizacionAnho();
    this.cargarMetadata();
    this.configurarDataStream();
  }

  private inicializarAnhos(): void {
    const anhoActual = new Date().getFullYear();
    this.anhos = Array.from({ length: 5 }, (_, i) => anhoActual - i);
  }

  private inicializarRangoPorDefecto(): void {
    const hoy = new Date();
    const anho = hoy.getFullYear();
    this.anhoControl.setValue(anho, { emitEvent: false });
    this.actualizarLimitesAnho(anho);
    const inicioMes = new Date(anho, hoy.getMonth(), 1);
    this.ajustandoRango = true;
    this.fechaRangoGroup.setValue({ inicio: inicioMes, fin: hoy }, { emitEvent: false });
    this.ajustandoRango = false;
  }

  private configurarSincronizacionAnho(): void {
    this.anhoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(anho => {
      if (this.ajustandoRango || anho == null) return;
      this.ajustarRangoPorAnho(anho);
    });

    this.fechaRangoGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.ajustandoRango) return;
      this.syncAnhoDesdeRango();
    });
  }

  private actualizarLimitesAnho(anho: number): void {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    this.minFechaAnho = new Date(anho, 0, 1);
    this.maxFechaAnho = anho === hoy.getFullYear() ? hoy : new Date(anho, 11, 31);
  }

  private ajustarRangoPorAnho(anho: number): void {
    const hoy = new Date();
    const inicio = new Date(anho, 0, 1);
    const fin = anho === hoy.getFullYear() ? hoy : new Date(anho, 11, 31);
    this.actualizarLimitesAnho(anho);
    this.ajustandoRango = true;
    this.fechaRangoGroup.setValue({ inicio, fin });
    this.ajustandoRango = false;
  }

  private syncAnhoDesdeRango(): void {
    const inicio = this.fechaRangoGroup.value.inicio;
    if (!inicio) return;
    const anho = inicio.getFullYear();
    if (this.anhoControl.value === anho) {
      this.actualizarLimitesAnho(anho);
      return;
    }
    this.ajustandoRango = true;
    this.anhoControl.setValue(anho, { emitEvent: false });
    this.actualizarLimitesAnho(anho);
    this.ajustandoRango = false;
  }

  abrirBusquedaProducto(): void {
    const data: PdvSearchProductoData = {
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
      modoSeleccionMultiple: true,
      productosSeleccionados: [...this.productosFiltro]
    };

    this.dialog.open(PdvSearchProductoDialogComponent, {
      data,
      width: '75%',
      height: '85%',
      maxWidth: '95vw'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((res: PdvSearchProductoResponseData) => {
      if (res?.productos?.length) {
        this.aplicarProductosFiltro(res.productos);
      }
    });
  }

  aplicarProductosFiltro(productos: Producto[]): void {
    this.productosFiltro = productos || [];
    this.productoSeleccionadoId = this.productosFiltro.length > 0
      ? String(this.productosFiltro[0].id)
      : null;
    this.cargarTodo();
  }

  quitarProductoFiltro(producto: Producto): void {
    this.productosFiltro = this.productosFiltro.filter(p => p.id !== producto.id);
    if (this.productoSeleccionadoId === String(producto.id)) {
      this.productoSeleccionadoId = this.productosFiltro.length > 0
        ? String(this.productosFiltro[0].id)
        : null;
    }
    this.cargarTodo();
  }

  limpiarProductosFiltro(): void {
    this.productosFiltro = [];
    this.productoSeleccionadoId = null;
    this.cargarTodo();
  }

  get etiquetaProductosFiltro(): string {
    if (this.productosFiltro.length === 0) return 'Todos los productos';
    if (this.productosFiltro.length === 1) return this.productosFiltro[0].descripcion;
    return `${this.productosFiltro.length} productos seleccionados`;
  }

  private cargarMetadata(): void {
    this.graficoService.obtenerSucursales().pipe(
      untilDestroyed(this),
      map(sucs => (sucs || []).filter(s => s.activo && s.id > 0 && s.id !== 999)),
      catchError(() => of([]))
    ).subscribe(sucs => this.sucursalesSubject.next(sucs));

    this.graficoService.obtenerFamilias().pipe(
      untilDestroyed(this),
      catchError(() => of([]))
    ).subscribe(fams => this.familiasSubject.next(fams));
  }

  private configurarDataStream(): void {
    combineLatest([
      this.sucursalControl.valueChanges.pipe(startWith(this.sucursalControl.value)),
      this.familiaControl.valueChanges.pipe(startWith(this.familiaControl.value)),
      this.limitControl.valueChanges.pipe(startWith(this.limitControl.value)),
      this.modoControl.valueChanges.pipe(startWith(this.modoControl.value)),
      this.fechaRangoGroup.valueChanges.pipe(startWith(this.fechaRangoGroup.value)),
      this.vistaTemporalControl.valueChanges.pipe(startWith(this.vistaTemporalControl.value))
    ]).pipe(
      debounceTime(400),
      untilDestroyed(this)
    ).subscribe(() => this.cargarTodo());
  }

  seleccionarProducto(productoId: string): void {
    this.productoSeleccionadoId = productoId;
    this.recargarTemporal();
  }

  onChartClick(event: any): void {
    const nombre = event?.name;
    if (!nombre) return;
    const datos = this.datosSubject.value;
    const producto = datos?.productos.find(p =>
      p.descripcion === nombre || this.truncar(p.descripcion, 28) === nombre
    );
    if (producto) {
      this.seleccionarProducto(producto.productoId);
    }
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

  private cargarTodo(): void {
    const rango = this.obtenerRangoFechas();
    if (!rango) return;

    this.ultimoRango = rango;
    this.cargando = true;
    this.cdr.markForCheck();

    const sucId = this.sucursalControl.value || undefined;
    const famId = this.familiaControl.value || undefined;
    const limit = this.limitControl.value || 15;
    const modo = this.modoControl.value || 'mas';
    const productoIdsFiltro = this.productosFiltro.map(p => p.id);
    const ascendente = modo === 'menos';

    this.graficoService.obtenerProductosMasVendidos(
      rango.inicio, rango.fin, sucId, famId, limit, ascendente, undefined,
      productoIdsFiltro.length > 0 ? productoIdsFiltro : undefined
    ).pipe(
      catchError(() => of([])),
      untilDestroyed(this)
    ).subscribe(productos => {
      const lista = productos || [];
      const idValido = this.productoSeleccionadoId
        && lista.some(p => String(p.productoId) === this.productoSeleccionadoId);
      const idTemporal = idValido
        ? this.productoSeleccionadoId
        : (lista.length > 0 ? String(lista[0].productoId) : null);

      this.productoSeleccionadoId = idTemporal;

      if (!idTemporal) {
        this.finalizarCarga(lista, [], [], modo, null, rango);
        return;
      }

      this.cargarVentasPeriodo(idTemporal, rango, lista, modo);
    });
  }

  private recargarTemporal(): void {
    const datos = this.datosSubject.value;
    const rango = this.ultimoRango || this.obtenerRangoFechas();
    if (!rango || !this.productoSeleccionadoId || !datos) return;

    this.cargando = true;
    this.cdr.markForCheck();

    const productosRaw = datos.productos.map(p => ({
      productoId: p.productoId,
      descripcion: p.descripcion,
      cantidad: p.cantidad,
      totalMonto: p.totalMonto,
      porcentaje: p.porcentaje
    } as ProductoVendidoEstadistica));

    this.cargarVentasPeriodo(
      this.productoSeleccionadoId,
      rango,
      productosRaw,
      this.modoControl.value || 'mas'
    );
  }

  private cargarVentasPeriodo(
    productoId: string,
    rango: RangoFechas,
    productos: ProductoVendidoEstadistica[],
    modo: ModoRanking
  ): void {
    const sucId = this.sucursalControl.value || undefined;
    const vista = this.vistaTemporalControl.value || 'dia';
    const ventasReq = vista === 'mes'
      ? this.graficoService.obtenerVentasProductoPorMes(rango.inicio, rango.fin, Number(productoId), sucId)
      : this.graficoService.obtenerVentasProductoPorDia(rango.inicio, rango.fin, Number(productoId), sucId);
    const comprasReq = vista === 'mes'
      ? this.graficoService.obtenerComprasProductoPorMes(rango.inicio, rango.fin, Number(productoId), sucId)
      : this.graficoService.obtenerComprasProductoPorDia(rango.inicio, rango.fin, Number(productoId), sucId);

    forkJoin({
      ventas: ventasReq.pipe(catchError(() => of([] as ProductoVentaPorPeriodo[]))),
      compras: comprasReq.pipe(catchError(() => of([] as ProductoCompraPorPeriodo[])))
    }).pipe(untilDestroyed(this)).subscribe(({ ventas, compras }) => {
      this.finalizarCarga(productos, ventas || [], compras || [], modo, productoId, rango);
    });
  }

  private finalizarCarga(
    productos: ProductoVendidoEstadistica[],
    ventasPeriodo: ProductoVentaPorPeriodo[],
    comprasPeriodo: ProductoCompraPorPeriodo[],
    modo: ModoRanking,
    productoId: string | null,
    rango: RangoFechas
  ): void {
    this.cargando = false;
    const vista = this.vistaTemporalControl.value || 'dia';
    this.actualizarVista(productos, ventasPeriodo, comprasPeriodo, modo, productoId, vista, rango);
  }

  private actualizarVista(
    estadisticas: ProductoVendidoEstadistica[],
    ventasPeriodo: ProductoVentaPorPeriodo[],
    comprasPeriodo: ProductoCompraPorPeriodo[],
    modo: ModoRanking,
    productoId: string | null,
    vistaTemporal: VistaTemporal,
    rango: RangoFechas
  ): void {
    const vista = this.construirVista(estadisticas, ventasPeriodo, comprasPeriodo, modo, productoId, vistaTemporal, rango);
    this.datosSubject.next(vista);
    this.cdr.markForCheck();
  }

  private construirVista(
    estadisticas: ProductoVendidoEstadistica[],
    ventasPeriodo: ProductoVentaPorPeriodo[],
    comprasPeriodo: ProductoCompraPorPeriodo[],
    modo: ModoRanking,
    productoId: string | null,
    vistaTemporal: VistaTemporal,
    rango: RangoFechas
  ): VistaAnalisis {
    const validas = (estadisticas || []).filter(e => e.cantidad > 0);

    const productos: ProductoDetalle[] = validas.map((e, i) => {
      const nivel = this.calcularNivelRotacion(e.indiceRotacion);
      return {
        productoId: String(e.productoId),
        descripcion: e.descripcion,
        cantidad: e.cantidad,
        totalMonto: e.totalMonto,
        cantidadFormateada: `${e.cantidad.toLocaleString('es-PY')} unidades`,
        montoFormateado: `₲ ${e.totalMonto.toLocaleString('es-PY')}`,
        porcentaje: e.porcentaje,
        nivel,
        nivelLabel: nivel === 'alto' ? 'Alta rotación' : nivel === 'medio' ? 'Rotación media' : 'Baja rotación',
        color: this.paleta[i % this.paleta.length],
        rank: i + 1
      };
    });

    const productoSeleccionado = productos.find(p => p.productoId === productoId) || productos[0] || null;
    const tituloRanking = modo === 'mas' ? 'Productos con mayor venta' : 'Productos con menor venta';

    return {
      rankingOptions: this.buildRankingChart(productos, tituloRanking, modo),
      ...this.buildTemporalChart(ventasPeriodo, comprasPeriodo, productoSeleccionado?.descripcion || 'Producto', vistaTemporal, rango),
      productos,
      productoSeleccionado,
      hayDatos: productos.length > 0,
      tituloRanking
    };
  }

  /** Rotación según movimiento_stock: ventas / (compras + transferencias entrantes). */
  private calcularNivelRotacion(indiceRotacion?: number): NivelVenta {
    const ratio = indiceRotacion ?? 0;
    if (ratio >= 0.66) return 'alto';
    if (ratio >= 0.33) return 'medio';
    return 'bajo';
  }

  private buildRankingChart(productos: ProductoDetalle[], titulo: string, modo: ModoRanking): EChartsOption {
    const nombres = [...productos].reverse().map(p => this.truncar(p.descripcion, 28));
    const cantidades = [...productos].reverse().map(p => p.cantidad);
    const colores = [...productos].reverse().map(p => {
      if (modo === 'menos') return this.colores.warn;
      return p.nivel === 'alto' ? this.colores.primary : p.nivel === 'medio' ? this.colores.warning : this.colores.textSecondary;
    });

    return {
      title: {
        text: titulo,
        subtext: 'Cantidad vendida en el período',
        left: 'center',
        textStyle: { color: this.colores.text, fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 11 }
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '28%', right: '8%', bottom: '8%', top: '18%' },
      xAxis: { type: 'value', axisLabel: { color: this.colores.textSecondary }, splitLine: { lineStyle: { color: '#444' } } },
      yAxis: {
        type: 'category',
        data: nombres,
        axisLabel: { color: this.colores.textSecondary, fontSize: 10 }
      },
      series: [{
        name: 'Cantidad',
        type: 'bar',
        data: cantidades.map((v, i) => ({ value: v, itemStyle: { color: colores[i], borderRadius: [0, 4, 4, 0] } }))
      }]
    };
  }

  private buildTemporalChart(
    ventasPeriodo: ProductoVentaPorPeriodo[],
    comprasPeriodo: ProductoCompraPorPeriodo[],
    nombreProducto: string,
    vistaTemporal: VistaTemporal,
    rango: RangoFechas
  ): Pick<VistaAnalisis, 'temporalOptions' | 'promedioPeriodo' | 'periodoPico' | 'labelPeriodoPico'> {
    const serie = vistaTemporal === 'mes'
      ? this.prepararSerieMensual(ventasPeriodo, comprasPeriodo, rango)
      : this.prepararSerieDiaria(ventasPeriodo, comprasPeriodo, rango);

    const { etiquetas, cantidades, montos, tooltips, comprasCantidades, comprasCount } = serie;
    const diasConVenta = cantidades.filter(c => c > 0).length;
    const totalCant = cantidades.reduce((s, v) => s + v, 0);
    const promedio = diasConVenta > 0 ? totalCant / diasConVenta : 0;
    const maxIdx = cantidades.length > 0 ? cantidades.indexOf(Math.max(...cantidades)) : -1;
    const periodoPico = maxIdx >= 0 && cantidades[maxIdx] > 0 ? etiquetas[maxIdx] : '-';
    const unidadPromedio = vistaTemporal === 'mes' ? 'uds/mes' : 'uds/día con venta';
    const tituloEvolucion = vistaTemporal === 'mes' ? 'Evolución mensual' : 'Evolución diaria';
    const rotar = etiquetas.length > 14;

    const temporalOptions: EChartsOption = {
      title: {
        text: `${tituloEvolucion}: ${this.truncar(nombreProducto, 35)}`,
        subtext: `Del ${etiquetas[0] || '-'} al ${etiquetas[etiquetas.length - 1] || '-'}`,
        left: 'center',
        textStyle: { color: this.colores.text, fontSize: 14, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 11 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex ?? 0;
          const ventas = cantidades[idx] || 0;
          const compras = comprasCantidades[idx] || 0;
          const nCompras = comprasCount[idx] || 0;
          let html = `<strong>${tooltips[idx]}</strong><br/>
            Ventas: ${ventas.toLocaleString('es-PY')} uds<br/>
            Monto ventas: ₲ ${(montos[idx] || 0).toLocaleString('es-PY')}`;
          if (compras > 0 || nCompras > 0) {
            html += `<br/>Entradas (compra + transf.): ${compras.toLocaleString('es-PY')} uds`;
            html += `<br/>Movimientos de entrada: ${nCompras}`;
          }
          return html;
        }
      },
      legend: { data: ['Ventas', 'Entradas', 'Promedio ventas'], bottom: 0, textStyle: { color: this.colores.textSecondary, fontSize: 10 } },
      grid: { left: '3%', right: '4%', bottom: rotar ? '22%' : '14%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: etiquetas,
        axisLabel: {
          color: this.colores.textSecondary,
          rotate: rotar ? 45 : 0,
          fontSize: 9,
          interval: this.calcularIntervaloEtiquetas(etiquetas.length)
        },
        axisLine: { lineStyle: { color: '#555' } }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: this.colores.textSecondary },
        splitLine: { lineStyle: { color: '#444' } }
      },
      series: [
        {
          name: 'Ventas',
          type: 'bar',
          data: cantidades.map((v, i) => {
            const tieneCompra = (comprasCantidades[i] || 0) > 0 || (comprasCount[i] || 0) > 0;
            return {
              value: v,
              itemStyle: {
                color: tieneCompra
                  ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#7E57C2' }, { offset: 1, color: '#512DA8' }] }
                  : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: this.colores.accent }, { offset: 1, color: '#00796B' }] },
                borderRadius: [4, 4, 0, 0]
              }
            };
          })
        },
        {
          name: 'Entradas',
          type: 'bar',
          data: comprasCantidades,
          itemStyle: { color: '#FF9800', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: 'Promedio ventas',
          type: 'line',
          data: cantidades.map(() => promedio),
          smooth: true,
          symbol: 'none',
          lineStyle: { color: this.colores.warning, type: 'dashed', width: 2 }
        }
      ]
    };

    return {
      temporalOptions,
      promedioPeriodo: `${promedio.toFixed(1)} ${unidadPromedio}`,
      periodoPico,
      labelPeriodoPico: vistaTemporal === 'mes' ? 'Mes con más ventas' : 'Día con más ventas'
    };
  }

  private prepararSerieDiaria(ventas: ProductoVentaPorPeriodo[], compras: ProductoCompraPorPeriodo[], rango: RangoFechas) {
    const mapaVentas = new Map<string, { cantidad: number; monto: number }>();
    for (const v of ventas) {
      const key = this.normalizarFechaPeriodo(v.periodo);
      mapaVentas.set(key, { cantidad: v.cantidad, monto: v.totalMonto });
    }
    const mapaCompras = new Map<string, { cantidad: number; cantidadCompras: number }>();
    for (const c of compras) {
      const key = this.normalizarFechaPeriodo(c.periodo);
      mapaCompras.set(key, { cantidad: c.cantidad, cantidadCompras: c.cantidadCompras });
    }

    const etiquetas: string[] = [];
    const tooltips: string[] = [];
    const cantidades: number[] = [];
    const montos: number[] = [];
    const comprasCantidades: number[] = [];
    const comprasCount: number[] = [];
    const cursor = new Date(rango.inicioDate);

    while (cursor <= rango.finDate) {
      const key = dateToString(cursor, 'yyyy-MM-dd');
      const dia = String(cursor.getDate()).padStart(2, '0');
      const mes = String(cursor.getMonth() + 1).padStart(2, '0');
      etiquetas.push(`${dia}/${mes}`);
      tooltips.push(`${dia}/${mes}/${cursor.getFullYear()}`);
      const d = mapaVentas.get(key);
      const c = mapaCompras.get(key);
      cantidades.push(d?.cantidad || 0);
      montos.push(d?.monto || 0);
      comprasCantidades.push(c?.cantidad || 0);
      comprasCount.push(c?.cantidadCompras || 0);
      cursor.setDate(cursor.getDate() + 1);
    }

    return { etiquetas, cantidades, montos, tooltips, comprasCantidades, comprasCount };
  }

  private prepararSerieMensual(ventas: ProductoVentaPorPeriodo[], compras: ProductoCompraPorPeriodo[], rango: RangoFechas) {
    const mapaVentas = new Map<string, { cantidad: number; monto: number }>();
    for (const v of ventas) {
      mapaVentas.set(v.periodo, { cantidad: v.cantidad, monto: v.totalMonto });
    }
    const mapaCompras = new Map<string, { cantidad: number; cantidadCompras: number }>();
    for (const c of compras) {
      mapaCompras.set(c.periodo, { cantidad: c.cantidad, cantidadCompras: c.cantidadCompras });
    }

    const etiquetas: string[] = [];
    const tooltips: string[] = [];
    const cantidades: number[] = [];
    const montos: number[] = [];
    const comprasCantidades: number[] = [];
    const comprasCount: number[] = [];
    const cursor = new Date(rango.inicioDate.getFullYear(), rango.inicioDate.getMonth(), 1);
    const finMes = new Date(rango.finDate.getFullYear(), rango.finDate.getMonth(), 1);

    while (cursor <= finMes) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const nombreMes = this.meses[cursor.getMonth()]?.nombre?.substring(0, 3) || key;
      etiquetas.push(`${nombreMes} ${cursor.getFullYear()}`);
      tooltips.push(`${this.meses[cursor.getMonth()]?.nombre} ${cursor.getFullYear()}`);
      const d = mapaVentas.get(key);
      const c = mapaCompras.get(key);
      cantidades.push(d?.cantidad || 0);
      montos.push(d?.monto || 0);
      comprasCantidades.push(c?.cantidad || 0);
      comprasCount.push(c?.cantidadCompras || 0);
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { etiquetas, cantidades, montos, tooltips, comprasCantidades, comprasCount };
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

  private truncar(texto: string, max: number): string {
    return texto.length > max ? texto.substring(0, max - 2) + '…' : texto;
  }

  trackByProductoId(_: number, item: ProductoDetalle): string {
    return item.productoId;
  }

  limpiarFiltros(): void {
    this.sucursalControl.setValue(null);
    this.familiaControl.setValue(null);
    this.limitControl.setValue(15);
    this.modoControl.setValue('mas');
    this.vistaTemporalControl.setValue('dia');
    this.limpiarProductosFiltro();
    this.inicializarRangoPorDefecto();
    this.cargarTodo();
  }
}
