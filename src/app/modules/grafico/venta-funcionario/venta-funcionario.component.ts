
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EChartsOption } from 'echarts';
import { BehaviorSubject, Observable, map, tap, combineLatest, startWith, debounceTime, switchMap, finalize, distinctUntilChanged } from 'rxjs';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from '../../empresarial/sucursal/sucursal.model';
import { GraficoService } from '../grafico.service';
import { MatDialog } from '@angular/material/dialog';
import { SearchListDialogComponent, SearchListtDialogData } from '../../../shared/components/search-list-dialog/search-list-dialog.component';
import { UsuarioSearchGQL } from '../../personas/usuarios/graphql/usuarioSearch';
import { Usuario } from '../../personas/usuarios/usuario.model';


interface DatosGraficoProcesados {
  opciones: EChartsOption;
  hayDatos: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'venta-funcionario',
  templateUrl: './venta-funcionario.component.html',
  styleUrls: ['./venta-funcionario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VentaFuncionarioComponent implements OnInit {

  private graficoService = inject(GraficoService);
  private dialog = inject(MatDialog);
  private usuarioSearchGQL = inject(UsuarioSearchGQL);


  private datosSubject = new BehaviorSubject<DatosGraficoProcesados | null>(null);
  datos$: Observable<DatosGraficoProcesados | null> = this.datosSubject.asObservable();

  private sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  sucursales$: Observable<Sucursal[]> = this.sucursalesSubject.asObservable();

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  cargando$: Observable<boolean> = this.cargandoSubject.asObservable();

  sucursalControl = new FormControl<number | null>(null);
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

  private funcionarioSeleccionadoSubject = new BehaviorSubject<Usuario | null>(null);
  funcionarioSeleccionado$ = this.funcionarioSeleccionadoSubject.asObservable();
  private allData: any[] = [];


  private colores = {
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    background: '#424242',
    backgroundDark: '#303030'
  };

  private paletaColores = ['#689F38', '#009688', '#FF9800', '#2196F3', '#4DB6AC', '#E91E63', '#9C27B0', '#00BCD4'];

  ngOnInit(): void {
    this.inicializarAnhos();

    setTimeout(() => {
      this.cargarMetadata();
      this.configurarDataStream();
    }, 100);
    this.mesControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.fechaControl.setValue(null, { emitEvent: false }));
    this.anhoControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => this.fechaControl.setValue(null, { emitEvent: false }));
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
  }

  private configurarDataStream(): void {
    combineLatest([
      this.sucursalControl.valueChanges.pipe(startWith(this.sucursalControl.value), distinctUntilChanged()),
      this.anhoControl.valueChanges.pipe(startWith(this.anhoControl.value), distinctUntilChanged()),
      this.mesControl.valueChanges.pipe(startWith(this.mesControl.value), distinctUntilChanged()),
      this.fechaControl.valueChanges.pipe(startWith(this.fechaControl.value), distinctUntilChanged()),
      this.funcionarioSeleccionadoSubject.pipe(distinctUntilChanged())
    ]).pipe(
      debounceTime(300),
      tap(() => this.cargandoSubject.next(true)),
      switchMap(([sucId, anho, mes, fechaDia, funcionario]) => {
        const { inicio, fin } = this.generarRangoFecha(anho || new Date().getFullYear(), mes, fechaDia);
        return this.graficoService.obtenerVentasPorFuncionario(inicio, fin, sucId || undefined, funcionario?.id).pipe(
          finalize(() => this.cargandoSubject.next(false))
        );
      }),
      untilDestroyed(this)
    ).subscribe(datos => {
      this.allData = datos || [];
      this.actualizarGrafico();
    });
  }

  buscarFuncionario() {
    const dialogData: SearchListtDialogData = {
      titulo: 'Buscar Funcionario',
      query: this.usuarioSearchGQL,
      tableData: [
        { id: 'id', nombre: 'ID', width: '50px' },
        { id: 'nombre', nombre: 'Nombre', nested: true, nestedId: 'persona' },
        { id: 'nickname', nombre: 'Usuario' }
      ],
      inicialSearch: true
    };

    this.dialog.open(SearchListDialogComponent, {
      data: dialogData,
      width: '600px',
      height: '600px'
    }).afterClosed().subscribe((selected: Usuario) => {
      if (selected) {
        this.funcionarioSeleccionadoSubject.next(selected);
      }
    });
  }

  get funcionarioSeleccionado() {
    return this.funcionarioSeleccionadoSubject.value;
  }

  limpiarFuncionario() {
    this.funcionarioSeleccionadoSubject.next(null);
  }

  private actualizarGrafico() {
    const data = this.procesarDatos(this.allData);
    this.datosSubject.next(data);

  }


  limpiarFiltros(): void {
    this.sucursalControl.setValue(null);
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
      const fechaFin = new Date(anho, mes, 1);
      const fin = `${fechaFin.getFullYear()}-${String(fechaFin.getMonth() + 1).padStart(2, '0')}-01 00:00`;
      return { inicio, fin };
    } else {
      return { inicio: `${anho}-01-01 00:00`, fin: `${anho + 1}-01-01 00:00` };
    }
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private procesarDatos(data: any[]): DatosGraficoProcesados {
    let validas = (data || []).sort((a, b) => (b.total || 0) - (a.total || 0));

    if (this.funcionarioSeleccionado) {
      const seleccionado = validas.find(v => v.id == this.funcionarioSeleccionado?.id);
      if (seleccionado) {
        validas = [seleccionado];
      } else {
        validas = [{
          id: this.funcionarioSeleccionado.id,
          funcionario: this.funcionarioSeleccionado.persona?.nombre || this.funcionarioSeleccionado.nickname,
          total: 0,
          cantidad: 0,
          productoMasVendido: 'Sin datos',
          sucursales: '-'
        }];
      }
    } else {
      validas = validas.slice(0, 15);
    }

    const totalGeneral = validas.reduce((sum, item) => sum + (item.total || 0), 0);
    const titulo = this.funcionarioSeleccionado
      ? `Ventas de: ${this.funcionarioSeleccionado.persona?.nombre || this.funcionarioSeleccionado.nickname}`
      : 'Ventas por Funcionario (Top 15)';

    const opciones: EChartsOption = {
      title: {
        text: titulo,
        subtext: `Total Mostrado: ₲ ${totalGeneral.toLocaleString('es-PY')}`,
        left: 'center', top: 10,
        textStyle: { color: this.colores.text, fontSize: 18, fontWeight: 'bold' },
        subtextStyle: { color: this.colores.textSecondary, fontSize: 12 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const el = params[0];
          const item = validas[el.dataIndex];
          return `<strong>${el.name}</strong><br/>
                    Total: ₲ ${Number(el.value).toLocaleString('es-PY')}<br/>
                    Cantidad de Ventas: ${item.cantidad}<br/>
                    <span style="font-size: 0.9em; color: #aaa">Producto Top:</span> ${item.productoMasVendido || 'N/A'}<br/>
                    <span style="font-size: 0.9em; color: #aaa">Sucursales:</span> ${item.sucursales || 'N/A'}`;
        }
      },
      grid: {
        left: '3%', right: '4%', bottom: '3%', containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: { color: this.colores.textSecondary, formatter: (val: number) => (val / 1000000).toFixed(0) + 'M' },
        splitLine: { lineStyle: { color: '#444' } }
      },
      yAxis: {
        type: 'category',
        data: validas.map(v => v.funcionario),
        axisLabel: { color: this.colores.textSecondary },
        inverse: true
      },
      series: [
        {
          name: 'Ventas',
          type: 'bar',
          data: validas.map(v => v.total),
          itemStyle: {
            color: (params: any) => this.paletaColores[params.dataIndex % this.paletaColores.length],
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: (p: any) => `₲ ${(p.value / 1000000).toFixed(1)}M`,
            color: this.colores.text
          }
        }
      ]
    };

    return { opciones, hayDatos: validas.length > 0 };
  }


}
